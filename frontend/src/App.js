import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './App.css';

const API_URL = 'http://localhost:4000';

function useBodyClass(className, active, bgImage) {
  useEffect(() => {
    if (active) {
      document.body.classList.add(className);
      if (bgImage) {
        document.body.style.backgroundImage = `url(${bgImage})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
      }
    } else {
      document.body.classList.remove(className);
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundRepeat = '';
    }
    return () => {
      document.body.classList.remove(className);
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundRepeat = '';
    };
  }, [className, active, bgImage]);
}

function Navbar() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  return (
    <div className={`navbar${isHome ? ' navbar-home' : ''}`}>
      <Link className="logo" to="/">Tiers Paysage</Link>
      <nav>
        <Link className={isHome ? 'active' : ''} to="/">Accueil</Link>
        <Link className={location.pathname==='/nouveautes' ? 'active' : ''} to="/nouveautes">Actualités</Link>
        <Link className={location.pathname==='/contact' ? 'active' : ''} to="/contact">Contact</Link>
      </nav>
    </div>
  );
}

function Home() {
  const [documents, setDocuments] = useState([]);
  useBodyClass('home-bg', true);
  useEffect(() => {
    axios.get(`${API_URL}/api/documents`).then(res => setDocuments(res.data));
  }, []);
  const nouveaute = documents[0];
  const mainImgIndex = nouveaute && typeof nouveaute.mainImage === 'number' ? nouveaute.mainImage : 0;
  const bgImage = nouveaute && nouveaute.images && nouveaute.images[mainImgIndex] ? `${API_URL}${nouveaute.images[mainImgIndex]}` : null;
  // Extrait du texte (sans balises HTML)
  const getExcerpt = (html, maxLen = 200) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || '';
    return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
  };
  const getBoldExcerpt = (html, boldLen = 80, totalLen = 200) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || '';
    const boldPart = text.slice(0, boldLen);
    const rest = text.slice(boldLen, totalLen);
    return { boldPart, rest, isLong: text.length > totalLen };
  };
  let excerpt = { boldPart: '', rest: '', isLong: false };
  if (nouveaute) excerpt = getBoldExcerpt(nouveaute.content);
  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: bgImage ? `url(${bgImage}) center/cover no-repeat` : '#f5f6fa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      position: 'relative',
    }}>
      {nouveaute && (
        <div style={{
          position:'relative',
          zIndex:2,
          textAlign:'left',
          color:'#fff',
          padding:'48px 40px',
          borderRadius:20,
          background:'rgba(0,0,0,0.32)',
          maxWidth:420,
          marginLeft:'7vw',
          boxShadow:'0 8px 32px rgba(0,0,0,0.18)',
          width:'100%',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',  
        }}>
          <div style={{fontWeight:700, fontSize:'1.1rem', marginBottom:10}}>Dernière actualité</div>
          <h1 style={{fontSize:'2.3rem', fontWeight:700, marginBottom:18}}>{nouveaute.title}</h1>
          <div style={{fontSize:'1.15rem', marginBottom:28, color:'#e0e0e0'}}>
            <span style={{fontWeight:700}}>{excerpt.boldPart}</span>{excerpt.rest}{excerpt.isLong && '...'}
          </div>
          <Link className="btn" style={{fontSize:'1.1rem', padding:'13px 30px'}} to={`/document/${nouveaute.id}`}>En savoir plus</Link>
        </div>
      )}
    </div>
  );
}

function Nouveautes() {
  const [documents, setDocuments] = useState([]);
  useEffect(() => {
    axios.get(`${API_URL}/api/documents`).then(res => {
      const sorted = [...res.data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setDocuments(sorted);
    });
  }, []);
  return (
    <div className="container">
      <h2 style={{marginBottom:24}}>Toutes les actualités</h2>
      <div className="card-list">
        {documents.map(doc => {
          const mainImgIndex = typeof doc.mainImage === 'number' ? doc.mainImage : 0;
          return (
            <div key={doc.id} className="card">
              {doc.images && doc.images[mainImgIndex] && (
                <img className="card-img" src={`${API_URL}${doc.images[mainImgIndex]}`} alt="visuel" />
              )}
              <div className="card-content">
                <div className="card-title">{doc.title}</div>
                <div className="card-date">{new Date(doc.createdAt).toLocaleDateString()}</div>
                <div className="card-excerpt" dangerouslySetInnerHTML={{__html: doc.content.slice(0, 100) + (doc.content.length > 100 ? '...' : '')}} />
                <Link className="btn" to={`/document/${doc.id}`}>Voir</Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DocumentDetail() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  useEffect(() => {
    axios.get(`${API_URL}/api/documents/${id}`).then(res => setDoc(res.data));
  }, [id]);
  if (!doc) return <div className="container">Chargement...</div>;
  return (
    <div className="container">
      <h2 style={{marginBottom:18}}>{doc.title}</h2>
      {doc.images && doc.images.length > 0 && (
        <div className="gallery">
          {doc.images.map((img, i) => (
            <img key={i} src={`${API_URL}${img}`} alt="visuel" />
          ))}
        </div>
      )}
      <div style={{marginBottom: 24}} dangerouslySetInnerHTML={{ __html: doc.content }} />
      <Link className="btn" to="/">Retour à l'accueil</Link>
    </div>
  );
}

function Admin() {
  const [password, setPassword] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [mainImage, setMainImage] = useState(0);
  const [imageResolutions, setImageResolutions] = useState([]);
  const [editId, setEditId] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/admin/login`, { password });
      if (res.data.success) setIsAuth(true);
      else setError('Mot de passe incorrect');
    } catch {
      setError('Mot de passe incorrect');
    }
  };

  useEffect(() => {
    if (isAuth) {
      axios.get(`${API_URL}/api/documents`).then(res => setDocuments(res.data));
    }
  }, [isAuth]);

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    if (files.length > 0) {
      const formData = new FormData();
      files.forEach(f => formData.append('images', f));
      try {
        const res = await axios.post(`${API_URL}/api/admin/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setUploadedImages(res.data.files);
      } catch {
        setError('Erreur upload image');
      }
    }
  };

  useEffect(() => {
    if (uploadedImages.length > 0) {
      Promise.all(
        uploadedImages.map(url => new Promise(resolve => {
          const img = new window.Image();
          img.onload = () => resolve({ w: img.width, h: img.height });
          img.onerror = () => resolve({ w: 0, h: 0 });
          img.src = `${API_URL}${url}`;
        }))
      ).then(resArr => setImageResolutions(resArr));
    } else {
      setImageResolutions([]);
    }
  }, [uploadedImages]);

  const recommendedIndex = imageResolutions.length > 0 ? imageResolutions.reduce((best, cur, i, arr) => {
    const curRes = cur.w * cur.h;
    const bestRes = arr[best].w * arr[best].h;
    return curRes > bestRes ? i : best;
  }, 0) : 0;

  const handleEdit = (doc) => {
    setEditId(doc.id);
    setTitle(doc.title);
    setContent(doc.content);
    setUploadedImages(doc.images || []);
    setMainImage(typeof doc.mainImage === 'number' ? doc.mainImage : 0);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title || !content) return setError('Titre et contenu requis');
    try {
      if (editId) {
        await axios.put(`${API_URL}/api/admin/documents/${editId}`, { title, content, password, images: uploadedImages, mainImage });
      } else {
        await axios.post(`${API_URL}/api/admin/documents`, { title, content, password, images: uploadedImages, mainImage });
      }
      setTitle('');
      setContent('');
      setImages([]);
      setUploadedImages([]);
      setMainImage(0);
      setEditId(null);
      setError('');
      const res = await axios.get(`${API_URL}/api/documents`);
      setDocuments(res.data);
    } catch {
      setError('Erreur lors de l\'ajout');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce document ?')) return;
    try {
      await axios.delete(`${API_URL}/api/admin/documents/${id}`, { data: { password } });
      setDocuments(docs => docs.filter(d => d.id !== id));
    } catch {
      setError('Erreur lors de la suppression');
    }
  };

  if (!isAuth) {
    return (
      <div className="container">
        <h2>Administration</h2>
        <form onSubmit={handleLogin}>
          <input type="password" placeholder="Mot de passe admin" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="btn" type="submit">Se connecter</button>
        </form>
        {error && <div style={{color:'red'}}>{error}</div>}
        <Link className="btn" to="/">Retour à l'accueil</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>Administration</h2>
      <form onSubmit={handleAdd}>
        <input type="text" placeholder="Titre" value={title} onChange={e => setTitle(e.target.value)} />
        <ReactQuill value={content} onChange={setContent} />
        <input type="file" multiple accept="image/*" onChange={handleImageChange} />
        <div className="gallery" style={{margin:'8px 0', display:'flex', gap:12}}>
          {uploadedImages.map((img, i) => (
            <div key={i} style={{position:'relative', display:'inline-block'}}>
              <img
                src={`${API_URL}${img}`}
                alt="preview"
                style={{maxHeight:60, border: mainImage === i ? '3px solid #1a7f5a' : '2px solid #ccc', borderRadius:6, cursor:'pointer'}}
                onClick={() => setMainImage(i)}
              />
              <input
                type="radio"
                name="mainImage"
                checked={mainImage === i}
                onChange={() => setMainImage(i)}
                style={{position:'absolute', top:4, left:4, zIndex:2}}
                title="Image principale"
              />
              {i === recommendedIndex && (
                <span style={{position:'absolute', bottom:2, right:2, background:'#1a7f5a', color:'#fff', fontSize:10, padding:'2px 6px', borderRadius:6, zIndex:2, fontWeight:700, boxShadow:'0 1px 4px rgba(0,0,0,0.18)'}}>recommandé</span>
              )}
            </div>
          ))}
        </div>
        <button className="btn" type="submit">{editId ? 'Enregistrer les modifications' : 'Ajouter'}</button>
        {editId && <button className="btn" type="button" style={{marginLeft:8, background:'#888'}} onClick={() => { setEditId(null); setTitle(''); setContent(''); setUploadedImages([]); setMainImage(0); }}>Annuler</button>}
      </form>
      {error && <div style={{color:'red'}}>{error}</div>}
      <h3>Documents existants</h3>
      <ul className="doc-list">
        {documents.map(doc => (
          <li key={doc.id} style={{marginBottom:8, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <span className="doc-title">{doc.title}</span>
            <div>
              <button className="btn" style={{marginRight:8}} onClick={() => handleEdit(doc)}>Modifier</button>
              <button className="btn" onClick={() => handleDelete(doc.id)}>Supprimer</button>
            </div>
          </li>
        ))}
      </ul>
      <Link className="btn" to="/">Retour à l'accueil</Link>
    </div>
  );
}

function Contact() {
  return (
    <div className="container" style={{maxWidth: 500, marginTop: 48, marginBottom: 48}}>
      <h2 style={{marginBottom: 24, color: '#1a7f5a'}}>Contact</h2>
      <div style={{fontSize: '1.1rem', marginBottom: 18}}>
        <strong>Téléphone :</strong> <a href="tel:0248503175" style={{color:'#1a7f5a', textDecoration:'none'}}>02.48.50.31.75</a><br/>
        <strong>Email :</strong> <a href="mailto:info@mille-univers.net" style={{color:'#1a7f5a', textDecoration:'none'}}>info@mille-univers.net</a>
      </div>
      <div style={{marginBottom: 18}}>
        <strong>Adresse :</strong><br/>
        32 B Route de la Chapelle,<br/>18000 Bourges
      </div>
      <div>
        <strong>Horaires :</strong><br/>
        Lundi – Mercredi : 8h30 à 12h30, de 13h30 à 18h30<br/>
        Jeudi : 8h30 à 12h30, de 13h30 à 17h30
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/nouveautes" element={<Nouveautes />} />
        <Route path="/document/:id" element={<DocumentDetail />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </Router>
  );
}

export default App;
