const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

// MongoDB (usa SQLite se não tiver Mongo)
let User, Profile;
try {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/perfis');
  console.log('✅ MongoDB conectado');
  
  const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: String,
    name: String,
    role: { type: String, default: 'user' }
  });
  User = mongoose.model('User', userSchema);
  
  const profileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    bio: String,
    photos: [String],
    videos: [String]
  });
  Profile = mongoose.model('Profile', profileSchema);
} catch(e) {
  console.log('⚠️ Usando memória (sem MongoDB)');
}

// Multer para upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// === ROTAS ===

// Registro
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    
    const user = new User({ email, password: hashed, name, role: 'admin' });
    await user.save();
    
    const token = jwt.sign({ id: user._id }, 'secretkey');
    res.json({ token, user: { id: user._id, email, name } });
  } catch(e) {
    res.status(400).json({ error: e.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user._id }, 'secretkey');
      res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
    } else {
      res.status(401).json({ error: 'Credenciais inválidas' });
    }
  } catch(e) {
    res.status(400).json({ error: e.message });
  }
});

// Middleware Auth
const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, 'secretkey');
    req.user = decoded;
    next();
  } catch(e) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Upload Admin
app.post('/api/admin/upload/:userId', auth, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ error: 'Nenhum arquivo' });
    
    const profile = await Profile.findOne({ userId: req.params.userId }) || 
                   new Profile({ userId: req.params.userId });
    
    req.files.forEach(file => {
      profile.photos.push(`/uploads/${file.filename}`);
    });
    
    await profile.save();
    res.json({ success: true, files: req.files, profile });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Listar Perfis
app.get('/api/profiles', auth, async (req, res) => {
  const profiles = await Profile.find().populate('userId', 'name');
  res.json(profiles);
});

// Criar Perfil
app.post('/api/profiles', auth, async (req, res) => {
  const profile = new Profile({ ...req.body, userId: req.user.id });
  await profile.save();
  res.json(profile);
});

app.listen(5000, () => {
  console.log('🚀 Backend: http://localhost:5000');
  // Criar pasta uploads
  if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
});
