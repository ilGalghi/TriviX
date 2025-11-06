// Script di migrazione per importare utenti da JSON a MongoDB
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trivix';
const USERS_JSON_PATH = path.join(__dirname, 'data', 'users.json');

async function migrateUsers() {
  try {
    console.log('🚀 Avvio migrazione utenti da JSON a MongoDB...\n');
    
    // Connessione a MongoDB
    console.log('📡 Connessione a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connesso a MongoDB\n');
    
    // Leggi gli utenti dal file JSON
    console.log('📖 Lettura utenti dal file JSON...');
    const jsonData = fs.readFileSync(USERS_JSON_PATH, 'utf8');
    const usersFromJson = JSON.parse(jsonData);
    console.log(`✅ Trovati ${usersFromJson.length} utenti nel file JSON\n`);
    
    // Verifica quanti utenti esistono già nel database
    const existingUsersCount = await User.countDocuments();
    console.log(`📊 Utenti esistenti nel database: ${existingUsersCount}`);
    
    if (existingUsersCount > 0) {
      console.log('\n⚠️  ATTENZIONE: Il database contiene già utenti!');
      console.log('Opzioni:');
      console.log('1. Svuotare il database e importare tutti gli utenti');
      console.log('2. Importare solo gli utenti nuovi (verifica per email/username)');
      console.log('3. Annullare la migrazione');
      console.log('\n💡 Modifica lo script per scegliere l\'opzione desiderata.');
      console.log('Per ora procedo con l\'opzione 2 (solo nuovi utenti)\n');
    }
    
    let importedCount = 0;
    let skippedCount = 0;
    let errors = 0;
    
    // Importa gli utenti uno per uno
    for (const userData of usersFromJson) {
      try {
        // Verifica se l'utente esiste già
        const existingUser = await User.findOne({
          $or: [
            { email: userData.email.toLowerCase() },
            { username: new RegExp(`^${userData.username}$`, 'i') }
          ]
        });
        
        if (existingUser) {
          console.log(`⏭️  Saltato: ${userData.username} (già esistente)`);
          skippedCount++;
          continue;
        }
        
        // Crea nuovo utente
        // IMPORTANTE: La password è già hashata nel JSON, quindi dobbiamo saltare il middleware
        const newUser = new User({
          username: userData.username,
          email: userData.email,
          password: userData.password, // Password già hashata
          profile: userData.profile,
          createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date()
        });
        
        // Salva senza triggerare il middleware di hashing
        await newUser.save({ validateBeforeSave: true });
        
        // Aggiorna la password hashata direttamente (perché il middleware la hasherebbe di nuovo)
        await User.updateOne(
          { _id: newUser._id },
          { $set: { password: userData.password } }
        );
        
        console.log(`✅ Importato: ${userData.username}`);
        importedCount++;
        
      } catch (error) {
        console.error(`❌ Errore importando ${userData.username}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 RISULTATO MIGRAZIONE:');
    console.log('='.repeat(50));
    console.log(`✅ Utenti importati: ${importedCount}`);
    console.log(`⏭️  Utenti saltati: ${skippedCount}`);
    console.log(`❌ Errori: ${errors}`);
    console.log(`📈 Totale utenti nel database: ${await User.countDocuments()}`);
    console.log('='.repeat(50) + '\n');
    
    console.log('🎉 Migrazione completata!\n');
    
    // Chiudi connessione
    await mongoose.connection.close();
    console.log('👋 Disconnesso da MongoDB');
    
  } catch (error) {
    console.error('💥 Errore durante la migrazione:', error);
    process.exit(1);
  }
}

// Esegui la migrazione
migrateUsers();
