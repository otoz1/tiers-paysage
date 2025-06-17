const express = require('express');
const cors = require('cors'); 
const bodyParser = require('body-parser');
const { Sequelize, DataTypes } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

const app = express();
const port = 4000;

// Configuration CORS plus explicite
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

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


// Relevé faune/flore
const Releve = sequelize.define('Releve', {
  annee: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING, // "faune", "flore", "champignon"
    allowNull: false,
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  emoji: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  protege: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  dateAjout: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
  }
});

// Synchroniser la base de données avec les modèles
sequelize.sync({ alter: true }).then(() => {
  console.log('Base de données synchronisée');
}).catch(err => {
  console.error('Erreur de synchronisation:', err);
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

// Releves publics
app.get('/api/releves', async (req, res) => {
  const { annee } = req.query;
  const where = annee ? { annee } : {};
  const releves = await Releve.findAll({ where, order: [['dateAjout', 'DESC']] });
  res.json(releves);
});

// mot de passe admin ( à changer)               /!\ IMPORTANT /!\
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

// Ajout relevé
app.post('/api/admin/releves', async (req, res) => {
  const { annee, type, nom, emoji, description, password } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  const rel = await Releve.create({ annee, type, nom, emoji, description });
  res.json(rel);
});

// Modif relevé
app.put('/api/admin/releves/:id', async (req, res) => {
  const { annee, type, nom, emoji, description, password } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  const rel = await Releve.findByPk(req.params.id);
  if (!rel) return res.status(404).json({ error: 'Not found' });
  rel.annee = annee;
  rel.type = type;
  rel.nom = nom;
  rel.emoji = emoji;
  rel.description = description;
  await rel.save();
  res.json(rel);
});

// Suppression relevé
app.delete('/api/admin/releves/:id', async (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  const rel = await Releve.findByPk(req.params.id);
  if (!rel) return res.status(404).json({ error: 'Not found' });
  await rel.destroy();
  res.json({ success: true });
});

// Supprimer tous les relevés d'une année
app.delete('/api/admin/releves/annee/:annee', async (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const count = await Releve.destroy({
      where: {
        annee: req.params.annee
      }
    });
    res.json({ success: true, count });
  } catch (e) {
    res.status(500).json({ error: 'Erreur lors de la suppression', details: e.message });
  }
});

// importer excel pour les relevés
app.post('/api/admin/import-releves', upload.single('file'), async (req, res) => {
  const { password, annee, type } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  if (!annee) return res.status(400).json({ error: 'Année manquante' });
  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
    let count = 0;
    for (const row of data) {
      if (!row[0] || !row[1]) continue; // Skip rows without required data
      const nomScientifique = row[0]; // Colonne 1 : Nom scientifique (description)
      const nomVernaculaire = row[1]; // Colonne 2 : Nom vernaculaire (titre)
      const isProtege = row[2] ? true : false; // Colonne 3 : Protégé
      
      await Releve.create({
        annee: annee,
        type: type || 'flore',
        nom: nomVernaculaire,
        description: nomScientifique,
        protege: isProtege,
        dateAjout: new Date()
      });
      count++;
    }
    res.json({ success: true, count });
  } catch (e) {
    res.status(500).json({ error: 'Erreur import', details: e.message });
  }
});

console.log('Ready to listen...');
app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});