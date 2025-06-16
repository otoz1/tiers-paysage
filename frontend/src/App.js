import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './App.css';

function Home() {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:4000/api/documents').then(res => setDocuments(res.data));
  }, []);

  return (
    <div>
      <h1>Accueil</h1>
      <Link to="/admin">Administration</Link>
      <ul>
        {documents.map(doc => (
          <li key={doc.id}>
            <b>{doc.title}</b> <Link to={`/document/${doc.id}`}>En savoir +</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DocumentDetail() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:4000/api/documents/${id}`).then(res => setDoc(res.data));
  }, [id]);

  if (!doc) return <div>Chargement...</div>;
  return (
    <div>
      <h1>{doc.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: doc.content }} />
      <Link to="/">Retour à l'accueil</Link>
    </div>
  );
}

function Admin() {
  const [password, setPassword] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');

  // Auth
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:4000/api/admin/login', { password });
      if (res.data.success) setIsAuth(true);
      else setError('Mot de passe incorrect');
    } catch {
      setError('Mot de passe incorrect');
    }
  };

  // Récupérer les pages
  useEffect(() => {
    if (isAuth) {
      axios.get('http://localhost:4000/api/documents').then(res => setDocuments(res.data));
    }
  }, [isAuth]);

  // Ajout d'une page
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title || !content) return setError('Titre et contenu requis');
    try {
      await axios.post('http://localhost:4000/api/admin/documents', { title, content, password });
      setTitle('');
      setContent('');
      setError('');
      // actualiser la liste
      const res = await axios.get('http://localhost:4000/api/documents');
      setDocuments(res.data);
    } catch {
      setError('Erreur lors de l\'ajout');
    }
  };

  // Supprimer une page
  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce document ?')) return;
    try {
      await axios.delete(`http://localhost:4000/api/admin/documents/${id}`, { data: { password } });
      setDocuments(docs => docs.filter(d => d.id !== id));
    } catch {
      setError('Erreur lors de la suppression');
    }
  };

  if (!isAuth) {
    return (
      <div>
        <h1>Administration</h1>
        <form onSubmit={handleLogin}>
          <input type="password" placeholder="Mot de passe admin" value={password} onChange={e => setPassword(e.target.value)} />
          <button type="submit">Se connecter</button>
        </form>
        {error && <div style={{color:'red'}}>{error}</div>}
        <Link to="/">Retour à l'accueil</Link>
      </div>
    );
  }

  return (
    <div>
      <h1>Administration</h1>
      <form onSubmit={handleAdd}>
        <input type="text" placeholder="Titre" value={title} onChange={e => setTitle(e.target.value)} />
        <ReactQuill value={content} onChange={setContent} />
        <button type="submit">Ajouter</button>
      </form>
      {error && <div style={{color:'red'}}>{error}</div>}
      <h2>Documents existants</h2>
      <ul>
        {documents.map(doc => (
          <li key={doc.id}>
            <b>{doc.title}</b>
            <button onClick={() => handleDelete(doc.id)} style={{marginLeft:8}}>Supprimer</button>
          </li>
        ))}
      </ul>
      <Link to="/">Retour à l'accueil</Link>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/document/:id" element={<DocumentDetail />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default App;
