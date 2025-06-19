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

if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
}

if (!fs.existsSync(path.join(__dirname, 'uploads', 'partenaires'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads', 'partenaires'));
}

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

const storagePartenaire = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads', 'partenaires'));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const uploadPartenaire = multer({ storage: storagePartenaire });

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
});

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
  showOnHome: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  showOnNouveautes: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
  }
});


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

const Partenaire = sequelize.define('Partenaire', {
  title: { type: DataTypes.STRING, allowNull: false },
  image: { type: DataTypes.STRING, allowNull: false },
  link: { type: DataTypes.STRING, allowNull: false }
});

sequelize.sync({ alter: true }).then(() => {
  console.log('Base de données synchronisée');
}).catch(err => {
  console.error('Erreur de synchronisation:', err);
});

sequelize.sync();

app.get('/api/documents', async (req, res) => {
  const docs = await Document.findAll({ order: [['createdAt', 'DESC']] });
  res.json(docs);
});

app.get('/api/documents/:id', async (req, res) => {
  const doc = await Document.findByPk(req.params.id);
  if (doc) res.json(doc);
  else res.status(404).json({ error: 'Not found' });
});

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

// upload image partenaire (1 seule)
app.post('/api/admin/upload-partenaire', uploadPartenaire.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fileUrl = `/uploads/partenaires/${req.file.filename}`;
  // Suppression auto si non utilisé dans 1 min
  setTimeout(() => {
    // Vérifier si l'image est utilisée par un partenaire
    Partenaire.findOne({ where: { image: fileUrl } }).then(p => {
      if (!p) {
        fs.unlink(path.join(__dirname, fileUrl), err => {});
      }
    });
  }, 60 * 1000);
  res.json({ file: fileUrl });
});

// création document avec images
app.post('/api/admin/documents', async (req, res) => {
  const { title, content, password, images, mainImage, showOnHome, showOnNouveautes } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  const doc = await Document.create({ title, content, images, mainImage, showOnHome, showOnNouveautes });
  res.json(doc);
});

app.put('/api/admin/documents/:id', async (req, res) => {
  const { title, content, password, images, mainImage, showOnHome, showOnNouveautes } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  const doc = await Document.findByPk(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  doc.title = title;
  doc.content = content;
  doc.images = images;
  doc.mainImage = mainImage;
  doc.showOnHome = showOnHome;
  doc.showOnNouveautes = showOnNouveautes;
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
      if (!row[0] || !row[1]) continue;
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
    // Supprimer le fichier Excel après traitement
    fs.unlink(req.file.path, err => {});
    res.json({ success: true, count });
  } catch (e) {
    // Supprimer le fichier Excel même en cas d'erreur
    if (req.file && req.file.path) fs.unlink(req.file.path, err => {});
    res.status(500).json({ error: 'Erreur import', details: e.message });
  }
});

app.get('/api/partenaires', async (req, res) => {
  const partenaires = await Partenaire.findAll({ order: [['id', 'ASC']] });
  res.json(partenaires);
});
app.post('/api/admin/partenaires', async (req, res) => {
  const { password, title, image, link } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  const p = await Partenaire.create({ title, image, link });
  res.json(p);
});
app.put('/api/admin/partenaires/:id', async (req, res) => {
  const { password, title, image, link } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  const p = await Partenaire.findByPk(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  // Si image changée, supprimer l'ancienne
  if (p.image && p.image !== image && p.image.startsWith('/uploads/partenaires/')) {
    fs.unlink(path.join(__dirname, p.image), err => {});
  }
  p.title = title; p.image = image; p.link = link;
  await p.save();
  res.json(p);
});
app.delete('/api/admin/partenaires/:id', async (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  const p = await Partenaire.findByPk(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  if (p.image && p.image.startsWith('/uploads/partenaires/')) {
    fs.unlink(path.join(__dirname, p.image), err => {});
  }
  await p.destroy();
  res.json({ success: true });
});

// Nettoyage des images orphelines dans uploads/ (non référencées en BDD)
app.post('/api/admin/cleanup-uploads', async (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  const uploadsDir = path.join(__dirname, 'uploads');
  const files = fs.readdirSync(uploadsDir).filter(f => !fs.lstatSync(path.join(uploadsDir, f)).isDirectory());

  // Récupérer toutes les images utilisées dans Document et Partenaire
  const docs = await Document.findAll();
  let usedImages = new Set();
  docs.forEach(doc => {
    (doc.images || []).forEach(img => {
      if (typeof img === 'string' && img.startsWith('/uploads/')) {
        usedImages.add(img.replace('/uploads/', ''));
      }
    });
  });
  const partenaires = await Partenaire.findAll();
  partenaires.forEach(p => {
    if (typeof p.image === 'string' && p.image.startsWith('/uploads/')) {
      usedImages.add(p.image.replace('/uploads/', ''));
    }
  });

  let deleted = [];
  for (const file of files) {
    if (!usedImages.has(file)) {
      try {
        fs.unlinkSync(path.join(uploadsDir, file));
        deleted.push(file);
      } catch {}
    }
  }
  res.json({ deleted });
});

console.log('Ready to listen...');
app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});