const express = require('express');
const cors = require('cors'); 
const bodyParser = require('body-parser');
const { Sequelize, DataTypes } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 4000;

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', err => {
  console.error('Unhandled Rejection:', err);
});

// dossier uploads
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
});

// Documents
const Document = sequelize.define('Document', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  images: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('images');
      return raw ? JSON.parse(raw) : [];
    },
    set(val) {
      this.setDataValue('images', JSON.stringify(val));
    }
  },
  mainImage: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
  }
});

sequelize.sync();

// API
app.get('/api/documents', async (req, res) => {
  const docs = await Document.findAll({ order: [['createdAt', 'DESC']] });
  res.json(docs);
});

app.get('/api/documents/:id', async (req, res) => {
  const doc = await Document.findByPk(req.params.id);
  if (doc) res.json(doc);
  else res.status(404).json({ error: 'Not found' });
});

// mot de passe admin ( à changer)
const ADMIN_PASSWORD = 'admin123';

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) res.json({ success: true });
  else res.status(401).json({ success: false });
});

// upload images (plusieurs)
app.post('/api/admin/upload', upload.array('images', 10), (req, res) => {
  const files = req.files.map(f => `/uploads/${f.filename}`);
  res.json({ files });
});

// création document avec images
app.post('/api/admin/documents', async (req, res) => {
  const { title, content, password, images, mainImage } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  const doc = await Document.create({ title, content, images, mainImage });
  res.json(doc);
});

app.put('/api/admin/documents/:id', async (req, res) => {
  const { title, content, password, images, mainImage } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  const doc = await Document.findByPk(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  doc.title = title;
  doc.content = content;
  doc.images = images;
  doc.mainImage = mainImage;
  await doc.save();
  res.json(doc);
});

app.delete('/api/admin/documents/:id', async (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  const doc = await Document.findByPk(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  await doc.destroy();
  res.json({ success: true });
});

console.log('Ready to listen...');
app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});