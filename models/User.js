const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Schema per le statistiche di gioco
const gameStatsSchema = new mongoose.Schema({
  gamesPlayed: { type: Number, default: 0 },
  gamesWon: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  points: { type: Number, default: 0 }
}, { _id: false });

// Schema per le prestazioni per categoria
const categoryPerformanceItemSchema = new mongoose.Schema({
  correct: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
}, { _id: false });

// Schema per il profilo utente
const profileSchema = new mongoose.Schema({
  avatar: { 
    type: String, 
    default: '/img/default-avatar.png' 
  },
  stats: {
    type: gameStatsSchema,
    default: () => ({})
  },
  categoryPerformance: {
    science: { type: categoryPerformanceItemSchema, default: () => ({}) },
    entertainment: { type: categoryPerformanceItemSchema, default: () => ({}) },
    sports: { type: categoryPerformanceItemSchema, default: () => ({}) },
    art: { type: categoryPerformanceItemSchema, default: () => ({}) },
    geography: { type: categoryPerformanceItemSchema, default: () => ({}) },
    history: { type: categoryPerformanceItemSchema, default: () => ({}) }
  }
}, { _id: false });

// Schema principale dell'utente
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username è obbligatorio'],
    unique: true,
    trim: true,
    minlength: [3, 'Username deve avere almeno 3 caratteri']
  },
  email: {
    type: String,
    required: [true, 'Email è obbligatoria'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email non valida']
  },
  password: {
    type: String,
    required: [true, 'Password è obbligatoria'],
    minlength: [6, 'Password deve avere almeno 6 caratteri']
  },
  profile: {
    type: profileSchema,
    default: () => ({})
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Gli indici sono già definiti automaticamente da unique: true nello schema
// Non serve dichiararli di nuovo

// Middleware pre-save per hashare la password
userSchema.pre('save', async function(next) {
  // Hash della password solo se è stata modificata
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Metodo per confrontare le password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Metodo per ottenere l'utente senza la password
userSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

// Metodi statici per compatibilità con il vecchio sistema

// Trova utente per username
userSchema.statics.findByUsername = async function(username) {
  return await this.findOne({ username: new RegExp(`^${username}$`, 'i') });
};

// Trova utente per email
userSchema.statics.findByEmail = async function(email) {
  return await this.findOne({ email: email.toLowerCase() });
};

// Autentica utente
userSchema.statics.authenticate = async function(username, password) {
  try {
    const user = await this.findByUsername(username);
    
    if (!user) {
      return { success: false, message: 'Utente non trovato' };
    }
    
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return { success: false, message: 'Password non corretta' };
    }
    
    return { success: true, user: user.toSafeObject() };
  } catch (error) {
    console.error('Errore durante autenticazione:', error);
    return { success: false, message: 'Errore del server' };
  }
};

// Aggiorna profilo utente
userSchema.statics.updateProfile = async function(userId, profileData) {
  try {
    const user = await this.findById(userId);
    
    if (!user) {
      return { success: false, message: 'Utente non trovato' };
    }
    
    // Aggiorna username se fornito e diverso
    if (profileData.username && profileData.username !== user.username) {
      const existingUser = await this.findByUsername(profileData.username);
      if (existingUser && existingUser._id.toString() !== userId) {
        return { success: false, message: 'Username già esistente' };
      }
      user.username = profileData.username;
    }
    
    // Aggiorna email se fornita e diversa
    if (profileData.email && profileData.email !== user.email) {
      const existingUser = await this.findByEmail(profileData.email);
      if (existingUser && existingUser._id.toString() !== userId) {
        return { success: false, message: 'Email già esistente' };
      }
      user.email = profileData.email;
    }
    
    // Aggiorna password se fornita
    if (profileData.password) {
      user.password = profileData.password; // Il middleware pre-save la hasherà
    }
    
    // Aggiorna avatar se fornito
    if (profileData.profile && profileData.profile.avatar) {
      let avatar = profileData.profile.avatar;
      
      // Converti URL assoluti in percorsi relativi
      const urlPattern = /^(https?:\/\/[^\/]+)(\/img\/.*)/i;
      const match = avatar.match(urlPattern);
      
      if (match) {
        avatar = match[2];
      }
      
      user.profile.avatar = avatar;
    }
    
    await user.save();
    
    return { success: true, user: user.toSafeObject() };
  } catch (error) {
    console.error('Errore durante aggiornamento profilo:', error);
    return { success: false, message: 'Errore del server' };
  }
};

// Aggiorna statistiche di gioco
userSchema.statics.updateGameStats = async function(userId, gameStats) {
  try {
    const user = await this.findById(userId);
    
    if (!user) {
      return { success: false, message: 'Utente non trovato' };
    }
    
    // Aggiorna le statistiche
    if (gameStats.gamesPlayed !== undefined) {
      user.profile.stats.gamesPlayed = gameStats.gamesPlayed;
    }
    if (gameStats.gamesWon !== undefined) {
      user.profile.stats.gamesWon = gameStats.gamesWon;
    }
    if (gameStats.correctAnswers !== undefined) {
      user.profile.stats.correctAnswers = gameStats.correctAnswers;
    }
    if (gameStats.points !== undefined) {
      user.profile.stats.points = gameStats.points;
    }
    
    // Aggiorna le prestazioni per categoria se fornite
    if (gameStats.categoryPerformance) {
      Object.keys(gameStats.categoryPerformance).forEach((category) => {
        if (!user.profile.categoryPerformance[category]) {
          user.profile.categoryPerformance[category] = { correct: 0, total: 0 };
        }
        
        user.profile.categoryPerformance[category].correct += 
          gameStats.categoryPerformance[category].correct || 0;
        user.profile.categoryPerformance[category].total += 
          gameStats.categoryPerformance[category].total || 0;
      });
    }
    
    await user.save();
    
    return { success: true };
  } catch (error) {
    console.error('Errore durante aggiornamento statistiche:', error);
    return { success: false, message: 'Errore del server' };
  }
};

// Aggiorna prestazioni per categoria singola
userSchema.statics.updateCategoryPerformance = async function(userId, category, isCorrect) {
  try {
    const user = await this.findById(userId);
    
    if (!user) {
      return { success: false, message: 'Utente non trovato' };
    }
    
    // Assicurati che la categoria esista
    if (!user.profile.categoryPerformance[category]) {
      user.profile.categoryPerformance[category] = { correct: 0, total: 0 };
    }
    
    // Incrementa il totale
    user.profile.categoryPerformance[category].total += 1;
    
    // Se corretta, incrementa anche il contatore delle corrette
    if (isCorrect) {
      user.profile.categoryPerformance[category].correct += 1;
      user.profile.stats.correctAnswers = (user.profile.stats.correctAnswers || 0) + 1;
    }
    
    await user.save();
    
    return {
      success: true,
      categoryPerformance: user.profile.categoryPerformance[category]
    };
  } catch (error) {
    console.error('Errore durante aggiornamento categoria:', error);
    return { success: false, message: 'Errore del server' };
  }
};

// Elimina utente
userSchema.statics.deleteUser = async function(userId) {
  try {
    const result = await this.findByIdAndDelete(userId);
    
    if (!result) {
      return { success: false, message: 'Utente non trovato' };
    }
    
    return { success: true, message: 'Profilo eliminato con successo' };
  } catch (error) {
    console.error('Errore durante eliminazione utente:', error);
    return { success: false, message: 'Errore del server' };
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;
