# 🎮 TriviX - Challenge Quiz
**Project by Leonardo Galgano and Daniele D'Alonzo** for the [Web Technologies and Systems](https://sites.google.com/uniroma1.it/lorenzomarconi/corsi#h.hel2jsy2h8y1) course at Sapienza University of Rome.

> *Test your knowledge and challenge your friends in real time!*

## 📝 Description
TriviX is an interactive platform for themed quizzes inspired by Trivia Crack, developed with modern web technologies. It offers an engaging gaming experience where users can:

- Answer questions in **six different categories**: science, entertainment, sports, art, geography, and history
- Challenge each other in **real-time multiplayer mode** with friends or other online players
- Practice in **single-player mode** to improve their knowledge
- Use **special power-ups** to gain strategic advantages during matches
- **Communicate via chat** with opponents while playing
- Track their **statistics and progress** for each category

The game combines learning and fun in an intuitive and captivating interface, accessible from any device.


## 🖼️ Preview
Available in both desktop and mobile versions:

![Desktop](/docs/TOT.png)



## ✨ Main Features
- **User authentication**: Registration, login, and profile management
- **Game modes**: Single player (training) and multiplayer
- **Real-time chat**: Communication between players during matches
- **Question and answer system**: Large database of questions from different categories
- **Statistics tracking**: Monitoring player progress and performance
- **Responsive interface**: Optimized gaming experience on various devices

## 🛠️ Technologies Used
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: JSON (for users, QA, matches), MongoDB with Mongoose (for chat)
- **Authentication**: Express-session, bcryptjs (password hashing)
- **Real-time communication**: Socket.IO
- **Other tools**: 
  - Tailwind CSS for styling
  - Dotenv for environment variable management (API KEY)
  - UUID for generating unique identifiers

## 📂 Project Structure
```
TriviX/
├── public/              # Static files (HTML, CSS, JavaScript)
│   ├── css/             # Stylesheets
│   ├── js/              # Front-end scripts
│   └── img/             # Images and graphic resources
├── routes/              # Application API routes
├── models/              # Data models
├── data/                # Static application data (JSON)
├── docs/                # Project documents and images
├── question_images/     # Images for questions
├── server.js            # Server entry point
├── package.json         # npm dependencies and configuration
└── README.md            # This README file
```

## 🚀 Installation and Usage
1. **Clone the repository**
   ```
   git clone https://github.com/ilGalghi/TriviX
   cd TriviX
   ```

2. **Install dependencies**
   ```
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the project root with the API KEY for Gemini AI
   ```
   GEMINI_API_KEY=AIzaS...
   ```

4. **Start the server**
   ```
   npm start
   ```

5. **Access the application**

   Open your browser and go to `http://localhost:3000`
