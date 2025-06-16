const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const port = 4000;

app.use(cors());
app.use(bodyParser.json());

// Initialisation de la base SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
});

// Modèle Document
const Document = sequelize.define('Document', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

// Synchronisation du modèle
sequelize.sync();

// Routes API
app.get('/api/documents', async (req, res) => {
  const docs = await Document.findAll();
  res.json(docs);
});

app.get('/api/documents/:id', async (req, res) => {
  const doc = await Document.findByPk(req.params.id);
  if (doc) res.json(doc);
  else res.status(404).json({ error: 'Not found' });
});

// Auth simple (mot de passe en dur)
const ADMIN_PASSWORD = 'admin123';

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) res.json({ success: true });
  else res.status(401).json({ success: false });
});

app.post('/api/admin/documents', async (req, res) => {
  const { title, content, password } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  const doc = await Document.create({ title, content });
  res.json(doc);
});

app.put('/api/admin/documents/:id', async (req, res) => {
  const { title, content, password } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  const doc = await Document.findByPk(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  doc.title = title;
  doc.content = content;
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

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
}); 