import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './App.css';
import gillesClementImg from './gilles-clement.png';
import ecoleJardinImg from './ecole-jardin.png';
import ReactDOM from 'react-dom';
import viewIcon from './view.png';


const API_URL = 'http://192.168.10.117:4000';

function useBodyClass(className, active, bgImage) {
  useEffect(() => {
    if (className) {
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
    } else {  
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundRepeat = '';
    }
    return () => {
      if (className) {
        document.body.classList.remove(className);
      }
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 700);
  useEffect(() => {
    setMenuOpen(false);
    const handleResize = () => setIsMobile(window.innerWidth <= 700);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const burgerButton = isMobile && ReactDOM.createPortal(
    <button
      className="burger-menu"
      aria-label="Ouvrir le menu"
      onClick={() => setMenuOpen(o => !o)}
      style={{
        background: '#fff',
        border: 'none',
        borderRadius: '50%',
        cursor: 'pointer',
        marginLeft: 8,
        boxShadow: '0 2px 12px rgba(0,0,0,0.13)',
        width: 38,
        height: 38,
        position: 'fixed',
        top: 10,
        right: 10,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 0,
        transition: 'box-shadow 0.18s',
      }}
      onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.18)'}
      onMouseOut={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.13)'}
    >
      <span style={{display:'block', width:22, height:4, background:'#1a7f5a', borderRadius:3, margin:'3px auto'}}></span>
      <span style={{display:'block', width:14, height:4, background:'#1a7f5a', borderRadius:3, margin:'3px auto'}}></span>
      <span style={{display:'block', width:22, height:4, background:'#1a7f5a', borderRadius:3, margin:'3px auto'}}></span>
    </button>,
    document.body
  );
  const handleNavClick = () => { if (isMobile) setMenuOpen(false); };
  return (
    <>
      <div className={`navbar${isHome ? ' navbar-home' : ''}${menuOpen ? ' open' : ''}`}
        style={isMobile ? {
          height: isHome ? 72 : 64,
          minHeight: isHome ? 72 : 64,
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          width: '100vw',
          zIndex: 1000,
          margin: 0,
          padding: 0
        } : {}}>
        <Link className="logo" to="/" style={isMobile ? {
          fontSize: '1.6rem',
          fontWeight: 800,
          color: '#1a7f5a',
          letterSpacing: '-1px',
          zIndex: 1001,
          background: 'transparent',
          padding: isHome ? '12px 16px' : '8px 16px',
          display: 'block',
        } : {}}>
          Tiers paysage Bourges
        </Link>
        <nav>
          <Link className={isHome ? 'active' : ''} to="/" onClick={handleNavClick}>Accueil</Link>
          <Link className={location.pathname==='/nouveautes' ? 'active' : ''} to="/nouveautes" onClick={handleNavClick}>Actualités</Link>
          <Link className={location.pathname==='/releve' ? 'active' : ''} to="/releve" onClick={handleNavClick}><span role="img" aria-label="relevé">🌱</span> Relevé 🦔</Link>
          <Link className={location.pathname==='/tiers-paysage' ? 'active' : ''} to="/tiers-paysage" onClick={handleNavClick}>Tiers paysage</Link>
          <Link className={location.pathname==='/gilles-clement' ? 'active' : ''} to="/gilles-clement" onClick={handleNavClick}>Gilles Clément</Link>
          <Link className={location.pathname==='/ecole-jardin-planetaire' ? 'active' : ''} to="/ecole-jardin-planetaire" onClick={handleNavClick}>École du jardin planétaire</Link>
          <Link className={location.pathname==='/contact' ? 'active' : ''} to="/contact" onClick={handleNavClick}>À propos</Link>
        </nav> 
      </div>
      {burgerButton}
    </>
  );
}

function Home() {
  const [documents, setDocuments] = useState([]);
  const [current, setCurrent] = useState(0);
  const [next, setNext] = useState(null);
  const [sliding, setSliding] = useState(false);
  const [bgImage, setBgImage] = useState('');
  const [progress, setProgress] = useState(0);
  const isMobile = window.innerWidth <= 700;
  const startRef = useRef(Date.now());
  useBodyClass('home-bg', true);
  useEffect(() => {
    axios.get(`${API_URL}/api/documents`).then(res => setDocuments(res.data));
  }, []);
  const filteredDocs = documents.filter(doc => doc.showOnHome !== false);
  useEffect(() => {
    if (filteredDocs.length < 2) return;
    setProgress(0);
    startRef.current = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      setProgress(Math.min(elapsed / 15000, 1));
    }, 50);
    return () => clearInterval(interval);
  }, [filteredDocs, current]);
  useEffect(() => {
    if (filteredDocs.length < 2) return;
    const timer = setInterval(() => {
      const nextIdx = (current + 1) % filteredDocs.length;
      setNext(nextIdx);
      setSliding(true);
      setTimeout(() => {
        setCurrent(nextIdx);
        setNext(null);
        setSliding(false);
      }, 600);
    }, 15000);
    return () => clearInterval(timer);
  }, [documents, current]);

  const getBgImage = (doc) => {
    if (!doc) return '#f5f6fa';
    const mainImgIndex = typeof doc.mainImage === 'number' ? doc.mainImage : 0;
    return doc.images && doc.images[mainImgIndex] ? `${API_URL}${doc.images[mainImgIndex]}` : '#f5f6fa';
  };
  const currDoc = filteredDocs[current];
  const nextDoc = next !== null ? filteredDocs[next] : null;

  const getBoldExcerpt = (html, boldLen = 80, totalLen = 200) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || '';
    const boldPart = text.slice(0, boldLen);
    const rest = text.slice(boldLen, totalLen);
    return { boldPart, rest, isLong: text.length > totalLen };
  };
  const currExcerpt = currDoc ? getBoldExcerpt(currDoc.content) : { boldPart: '', rest: '', isLong: false };
  const nextExcerpt = nextDoc ? getBoldExcerpt(nextDoc.content) : { boldPart: '', rest: '', isLong: false };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      background: getBgImage(currDoc) ? `url(${getBgImage(currDoc)}) center/cover no-repeat` : '#f5f6fa',
      transition: sliding ? 'none' : 'background-image 0.6s cubic-bezier(.4,0,.2,1)',
    }}>
      {sliding && nextDoc && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          background: getBgImage(nextDoc) ? `url(${getBgImage(nextDoc)}) center/cover no-repeat` : '#f5f6fa',
          transform: 'translateX(100vw)',
          animation: 'slide-bg-left 0.6s cubic-bezier(.4,0,.2,1) forwards',
        }} />
      )}
      <div style={{
        position:'relative',
        width:'100vw',
        height: isMobile ? '100vh' : 420,
        display:'flex',
        alignItems:'center',
        justifyContent: isMobile ? 'center' : 'flex-start',
      }}>
        <div
          className={sliding ? 'carousel-slide-box slide-left' : 'carousel-slide-box'}
          style={{
            position: isMobile ? 'relative' : 'absolute',
            left: isMobile ? undefined : 0,
            top: isMobile ? undefined : 0,
            zIndex:2,
            textAlign:'left',
            color:'#fff',
            padding: isMobile ? '8px 8px' : '48px 40px',
            borderRadius: isMobile ? 10 : 20,
            background:'rgba(0,0,0,0.32)',
            maxWidth: isMobile ? 240 : 420,
            minWidth: isMobile ? 120 : undefined,
            margin: 0,
            marginLeft: isMobile ? 0 : '7vw',
            boxShadow: isMobile ? '0 1px 4px rgba(0,0,0,0.10)' : '0 8px 32px rgba(0,0,0,0.18)',
            overflow: 'hidden',
            wordBreak: 'break-word',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            transition: 'none',
            fontSize: isMobile ? '0.97rem' : undefined,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            justifyContent: 'center',
            alignSelf: isMobile ? 'center' : undefined,
          }}
        >
          <div style={{fontWeight:800, fontSize: isMobile ? '1.15rem' : '1.1rem', marginBottom:12, color:'#fff', textAlign:'left'}}>Dernière actualité</div>
          <h2 style={{fontSize: isMobile ? '1.25rem' : '2.3rem', fontWeight:700, marginBottom:14, color:'#fff', textAlign:'left', lineHeight:1.2}}>{currDoc?.title}</h2>
          <div style={{fontSize: isMobile ? '0.98rem' : '1.15rem', marginBottom:18, color:'#f8fafd', textShadow:'0 1px 8px rgba(0,0,0,0.18)', textAlign:'left'}}>
            <span style={{fontWeight:700, color:'#fff'}}>{currExcerpt.boldPart}</span>{currExcerpt.rest}{currExcerpt.isLong && '...'}
          </div>
          {currDoc && <Link className="btn" style={isMobile ? {
            fontSize: '0.98rem',
            padding: '8px 8px',
            background:'#fff',
            color:'#1a7f5a',
            fontWeight:700,
            boxShadow:'0 1px 6px rgba(0,0,0,0.10)',
            alignSelf:'flex-end',
            margin:'0'
          } : {}} to={`/document/${currDoc.id}`}>En savoir plus</Link>}
        </div>
        {sliding && nextDoc && (
          <div
            className="carousel-slide-box slide-in"
            style={{
              position: isMobile ? 'relative' : 'absolute',
              left: isMobile ? undefined : 0,
              top: isMobile ? undefined : 0,
              zIndex:2,
              textAlign:'left',
              color:'#fff',
              padding: isMobile ? '8px 8px' : '48px 40px',
              borderRadius: isMobile ? 10 : 20,
              background:'rgba(0,0,0,0.32)',
              maxWidth: isMobile ? 240 : 420,
              minWidth: isMobile ? 120 : undefined,
              margin: 0,
              marginLeft: isMobile ? 0 : '7vw',
              boxShadow: isMobile ? '0 1px 4px rgba(0,0,0,0.10)' : '0 8px 32px rgba(0,0,0,0.18)',
              overflow: 'hidden',
              wordBreak: 'break-word',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              transition: 'none',
              fontSize: isMobile ? '0.97rem' : undefined,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              justifyContent: 'center',
              alignSelf: isMobile ? 'center' : undefined,
            }}
          >
            <div style={{fontWeight:700, fontSize: isMobile ? '1rem' : '1.1rem', marginBottom:10}}>Dernière actualité</div>
            <h2 style={{fontSize: isMobile ? '2.5rem' : '2.3rem', fontWeight:700, marginBottom:18}}>{nextDoc.title}</h2>
            <div style={{fontSize: isMobile ? '1rem' : '1.15rem', marginBottom:28, color:'#e0e0e0'}}>
              <span style={{fontWeight:700}}>{nextExcerpt.boldPart}</span>{nextExcerpt.rest}{nextExcerpt.isLong && '...'}
            </div>
            <Link className="btn" style={isMobile ? {
              fontSize: '0.98rem',
              padding: '8px 8px',
              background:'#fff',
              color:'#1a7f5a',
              fontWeight:700,
              boxShadow:'0 1px 6px rgba(0,0,0,0.10)',
              alignSelf:'flex-end',
              margin:'0'
            } : {}} to={`/document/${nextDoc.id}`}>En savoir plus</Link>
          </div>
        )}
      </div>
      {/* Barre de chargement discrète */}
      <div className="barre-chargement" style={{
        position: 'fixed',
        left: 0,
        bottom: 0,
        width: '100vw',
        height: 4,
        background: 'rgba(255,255,255,0.13)',
        zIndex: 50,
        boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
        opacity: 0.7,
        pointerEvents: 'none',
      }}>
        <div style={{
          height: '100%',
          width: `${Math.max(1, Math.round(progress * 100))}vw`,
          background: 'linear-gradient(90deg, #1a7f5a 60%, #e0e0e0 100%)',
          backgroundColor: '#1a7f5a',
          transition: 'width 0.2s cubic-bezier(.4,0,.2,1)',
          opacity: 0.85,
        }} />
      </div>
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
  // Filtrage effectif :
  const filteredDocs = documents.filter(doc => doc.showOnNouveautes !== false);
  return (
    <div className="container">
      <h2 style={{marginBottom:24}}>Toutes les actualités</h2>
      <div className="card-list">
        {filteredDocs.map(doc => {
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
  const [adminTab, setAdminTab] = useState('');
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
  const [releves, setReleves] = useState([]);
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [releveType, setReleveType] = useState('faune');
  const [releveNom, setReleveNom] = useState('');
  const [releveDesc, setReleveDesc] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importYear, setImportYear] = useState(annee);
  const [importType, setImportType] = useState('faune');
  const [importMsg, setImportMsg] = useState('');
  const [partenaires, setPartenaires] = useState([]);
  const [editIdPartenaire, setEditIdPartenaire] = useState(null);
  const [titlePartenaire, setTitlePartenaire] = useState('');
  const [imagePartenaire, setImagePartenaire] = useState('');
  const [linkPartenaire, setLinkPartenaire] = useState('');
  const [errorPartenaire, setErrorPartenaire] = useState('');
  const [uploadingPartenaireImg, setUploadingPartenaireImg] = useState(false);
  const [showOnHome, setShowOnHome] = useState(true);
  const [showOnNouveautes, setShowOnNouveautes] = useState(true);

  useEffect(() => {
    if (isAuth && adminTab === 'partenaires') {
      axios.get(`${API_URL}/api/partenaires`).then(res => setPartenaires(res.data));
    }
  }, [isAuth, adminTab]);

  useEffect(() => {
    if (isAuth && adminTab === 'actus') {
      axios.get(`${API_URL}/api/documents`).then(res => setDocuments(res.data));
    }
  }, [isAuth, adminTab]);

  
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
    if (isAuth && adminTab === 'releve') {
      axios.get(`${API_URL}/api/releves?annee=${annee}`).then(res => setReleves(res.data));
    }
  }, [isAuth, adminTab, annee]);

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
    setShowOnHome(doc.showOnHome !== false); // true si undefined
    setShowOnNouveautes(doc.showOnNouveautes !== false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title || !content) return setError('Titre et contenu requis');
    try {
      if (editId) {
        await axios.put(`${API_URL}/api/admin/documents/${editId}`, { title, content, password, images: uploadedImages, mainImage, showOnHome: !!showOnHome, showOnNouveautes: !!showOnNouveautes });
      } else {
        await axios.post(`${API_URL}/api/admin/documents`, { title, content, password, images: uploadedImages, mainImage, showOnHome: !!showOnHome, showOnNouveautes: !!showOnNouveautes });
      }
      setTitle('');
      setContent('');
      setImages([]);
      setUploadedImages([]);
      setMainImage(0);
      setEditId(null);
      setShowOnHome(true);
      setShowOnNouveautes(true);
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

  const handleAddReleve = async (e) => {
    e.preventDefault();
    if (!releveNom) return setError('Nom requis');
    try {
      await axios.post(`${API_URL}/api/admin/releves`, { 
        annee, 
        type: releveType, // Le backend attend 'type'
        nom: releveNom, 
        description: releveDesc, 
        password,
        emoji: releveType === 'faune' ? '🦋' : releveType === 'flore' ? '🌸' : '🍄'
      });
      setReleveNom(''); 
      setReleveDesc('');
      const res = await axios.get(`${API_URL}/api/releves?annee=${annee}`);
      setReleves(res.data);
      setError('');
    } catch {
      setError('Erreur lors de l\'ajout du relevé');
    }
  };

  const handleDeleteReleve = async (id) => {
    if (!window.confirm('Supprimer ce relevé ?')) return;
    try {
      await axios.delete(`${API_URL}/api/admin/releves/${id}`, { data: { password } });
      setReleves(releves => releves.filter(r => r.id !== id));
      setError('');
    } catch {
      setError('Erreur lors de la suppression du relevé');
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile) return setImportMsg('Sélectionnez un fichier.');
    if (!importYear) return setImportMsg('Indiquez une année.');
    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('annee', importYear);
    formData.append('type', importType);
    formData.append('password', password);
    try {
      const res = await axios.post(`${API_URL}/api/admin/import-releves`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImportMsg(`Import réussi : ${res.data.count} relevés ajoutés.`);
      setShowImport(false);
      setImportFile(null);
      setImportYear(annee);
      setImportType('faune');
      // recharge la liste
      const r = await axios.get(`${API_URL}/api/releves?annee=${annee}`);
      setReleves(r.data);
    } catch (err) {
      setImportMsg('Erreur import : ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteAllReleves = async () => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer tous les relevés de ${annee} ?`)) return;
    try {
      const res = await axios.delete(`${API_URL}/api/admin/releves/annee/${annee}`, { data: { password } });
      setReleves([]);
      setError('');
      alert(`${res.data.count} relevés ont été supprimés.`);
    } catch {
      setError('Erreur lors de la suppression des relevés');
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

  if (!adminTab) {
    return (
      <div className="container">
        <h2>Administration</h2>
        <div style={{display:'flex', gap:24, margin:'32px 0'}}>
          <button className="btn" style={{fontSize:'1.2rem', padding:'18px 32px'}} onClick={()=>setAdminTab('actus')}>Gestion des actualités</button>
          <button className="btn" style={{fontSize:'1.2rem', padding:'18px 32px', background:'#1a7f5a'}} onClick={()=>setAdminTab('releve')}>Gestion des relevés</button>
          <button className="btn" style={{fontSize:'1.2rem', padding:'18px 32px', background:'#1a7f5a'}} onClick={()=>setAdminTab('partenaires')}>Gestion des partenaires</button>
        </div>
        <Link className="btn" to="/">Retour à l'accueil</Link>
      </div>
    );
  }

  if (adminTab === 'releve') {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear + 1; y >= 2023; y--) years.push(y);
    return (
      <div className="container">
        <h2 style={{marginBottom:18}}>Gestion des relevés</h2>
        <div style={{marginBottom:18}}>
          <label>Année : </label>
          <select value={annee} onChange={e=>setAnnee(Number(e.target.value))} style={{fontSize:'1.1rem', padding:'6px 12px', borderRadius:6, border:'1px solid #ccc'}}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn" style={{marginLeft:12, background:'#e57373'}} onClick={handleDeleteAllReleves}>Supprimer tous les relevés de {annee}</button>
        </div>
        <button className="btn" style={{marginBottom:18, background:'#1a7f5a'}} onClick={()=>setShowImport(v=>!v)}>{showImport ? 'Annuler import' : 'Importer depuis tableur'}</button>
        {showImport && (
          <form onSubmit={handleImport} style={{marginBottom:18, background:'#eafaf2', borderRadius:8, padding:16, display:'flex', flexDirection:'column', gap:10, maxWidth:400}}>
            <label><b>Fichier Excel (.xlsx)</b> : <input type="file" accept=".xlsx" onChange={e=>setImportFile(e.target.files[0])} /></label>
            <label>Année : <input type="number" value={importYear} onChange={e=>setImportYear(e.target.value)} min="2000" max="2100" style={{marginLeft:8, width:90}} /></label>
            <label>Type :
              <select value={importType} onChange={e=>setImportType(e.target.value)} style={{marginLeft:8}}>
                <option value="faune">Faune</option>
                <option value="flore">Flore</option>
                <option value="autre">Autre</option>
              </select>
            </label>
            <button className="btn" type="submit">Importer</button>
            {importMsg && <div style={{color: importMsg.startsWith('Erreur') ? 'red' : 'green', marginTop:8}}>{importMsg}</div>}
          </form>
        )}
        <form onSubmit={handleAddReleve} style={{display:'flex', gap:8, marginBottom:18, flexWrap:'wrap', alignItems:'center'}}>
          <select value={releveType} onChange={e=>setReleveType(e.target.value)} style={{fontSize:'1rem', padding:'6px 10px', borderRadius:6}}>
            <option value="faune">🦋 Faune</option>
            <option value="flore">🌸 Flore</option>
            <option value="autre">🍄 Autre</option>
          </select>
          <input type="text" placeholder="Nom" value={releveNom} onChange={e=>setReleveNom(e.target.value)} style={{fontSize:'1rem', padding:'6px 10px', borderRadius:6, minWidth:120}} />
          <input type="text" placeholder="Description" value={releveDesc} onChange={e=>setReleveDesc(e.target.value)} style={{fontSize:'1rem', padding:'6px 10px', borderRadius:6, minWidth:180}} />
          <button className="btn" type="submit">Ajouter</button>
        </form>
        <table style={{width:'100%', borderCollapse:'collapse', background:'#f8fafc', borderRadius:10, boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
          <thead>
            <tr style={{background:'#eafaf2'}}>
              <th style={{padding:'8px'}}>Type</th>
              <th style={{padding:'8px'}}>Nom</th>
              <th style={{padding:'8px'}}>Description</th>
              <th style={{padding:'8px'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {releves.map(r => (
              <tr key={r.id}>
                <td style={{padding:'8px', fontWeight:600, fontSize:'1.1rem'}}>{r.type === 'plante' ? '🌿' : r.type === 'faune' ? '🦋' : r.type === 'flore' ? '🌸' : '🍄'} {r.type}</td>
                <td style={{padding:'8px', fontWeight:700}}>{r.nom}</td>
                <td style={{padding:'8px'}}>{r.description}</td>
                <td style={{padding:'8px'}}>
                  <button className="btn" style={{background:'#e57373'}} onClick={()=>handleDeleteReleve(r.id)}>Supprimer</button>
                </td>
              </tr>
            ))}
            {releves.length === 0 && <tr><td colSpan={4} style={{textAlign:'center', color:'#888', padding:'18px'}}>Aucun relevé pour cette année.</td></tr>}
          </tbody>
        </table>
        <button className="btn" style={{marginTop:18}} onClick={()=>setAdminTab('')}>Retour</button>
        {error && <div style={{color:'red', marginTop:12}}>{error}</div>}
      </div>
    );
  }

  if (adminTab === 'partenaires') {
    const handleSave = async (e) => {
      e.preventDefault();
      try {
        if (editIdPartenaire) {
          await axios.put(`${API_URL}/api/admin/partenaires/${editIdPartenaire}`, { password, title: titlePartenaire, image: imagePartenaire, link: linkPartenaire });
        } else {
          await axios.post(`${API_URL}/api/admin/partenaires`, { password, title: titlePartenaire, image: imagePartenaire, link: linkPartenaire });
        }
        setTitlePartenaire(''); setImagePartenaire(''); setLinkPartenaire(''); setEditIdPartenaire(null);
        const res = await axios.get(`${API_URL}/api/partenaires`);
        setPartenaires(res.data);
        setErrorPartenaire('');
      } catch {
        setErrorPartenaire('Erreur lors de la sauvegarde');
      }
    };
    const handleDelete = async (id) => {
      if (!window.confirm('Supprimer ce partenaire ?')) return;
      try {
        await axios.delete(`${API_URL}/api/admin/partenaires/${id}`, { data: { password } });
        setPartenaires(partenaires => partenaires.filter(p => p.id !== id));
      } catch {
        setErrorPartenaire('Erreur lors de la suppression');
      }
    };
    const handleEdit = (p) => {
      setEditIdPartenaire(p.id); setTitlePartenaire(p.title); setImagePartenaire(p.image); setLinkPartenaire(p.link);
    };
    const handleImagePartenaireChange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setUploadingPartenaireImg(true);
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await axios.post(`${API_URL}/api/admin/upload-partenaire`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.file) {
          setImagePartenaire(res.data.file);
        }
      } catch {
        setErrorPartenaire("Erreur upload image");
      }
      setUploadingPartenaireImg(false);
    };
    return (
      <div className="container">
        <h2>Gestion des partenaires</h2>
        <form onSubmit={handleSave} style={{marginBottom:18, background:'#eafaf2', borderRadius:8, padding:16, display:'flex', flexDirection:'column', gap:10, maxWidth:400}}>
          <input type="text" placeholder="Nom" value={titlePartenaire} onChange={e=>setTitlePartenaire(e.target.value)} required />
          <input type="file" accept="image/*" onChange={handleImagePartenaireChange} />
          {uploadingPartenaireImg && <div style={{color:'#888'}}>Upload en cours...</div>}
          {imagePartenaire && (
            <img src={`${API_URL}${imagePartenaire}`} alt="aperçu" style={{maxWidth:80, maxHeight:80, borderRadius:8, marginTop:4, marginBottom:4, border:'1px solid #eafaf2'}} />
          )}
          <input type="text" placeholder="Lien du site" value={linkPartenaire} onChange={e=>setLinkPartenaire(e.target.value)} required />
          <button className="btn" type="submit">{editIdPartenaire ? 'Enregistrer' : 'Ajouter'}</button>
          {editIdPartenaire && <button className="btn" type="button" style={{background:'#888'}} onClick={()=>{setEditIdPartenaire(null); setTitlePartenaire(''); setImagePartenaire(''); setLinkPartenaire('');}}>Annuler</button>}
          {errorPartenaire && <div style={{color:'red'}}>{errorPartenaire}</div>}
        </form>
        <ul style={{listStyle:'none', padding:0}}>
          {partenaires.map(p => (
            <li key={p.id} style={{marginBottom:8, display:'flex', alignItems:'center', gap:12}}>
              <img src={`${API_URL}${p.image}`} alt={p.title} style={{width:40, height:40, borderRadius:8, objectFit:'cover', border:'1px solid #eafaf2'}} />
              <span style={{fontWeight:600}}>{p.title}</span>
              <a href={p.link} target="_blank" rel="noopener noreferrer" style={{color:'#1a7f5a', fontSize:'0.98rem'}}>{p.link}</a>
              <button className="btn" style={{marginLeft:8}} onClick={()=>handleEdit(p)}>Modifier</button>
              <button className="btn" style={{background:'#e57373'}} onClick={()=>handleDelete(p.id)}>Supprimer</button>
            </li>
          ))}
        </ul>
        <button className="btn" style={{marginTop:18}} onClick={()=>setAdminTab('')}>Retour</button>
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
        <div style={{display:'flex', gap:18, margin:'10px 0'}}>
          <label style={{display:'flex', alignItems:'center', gap:6}}>
            <input type="checkbox" checked={showOnHome} onChange={e => setShowOnHome(e.target.checked)} />
            Afficher sur la page d'accueil
          </label>
          <label style={{display:'flex', alignItems:'center', gap:6}}>
            <input type="checkbox" checked={showOnNouveautes} onChange={e => setShowOnNouveautes(e.target.checked)} />
            Afficher dans les actualités
          </label>
        </div>
        <button className="btn" type="submit">{editId ? 'Enregistrer les modifications' : 'Ajouter'}</button>
        {editId && <button className="btn" type="button" style={{marginLeft:8, background:'#888'}} onClick={() => { setEditId(null); setTitle(''); setContent(''); setUploadedImages([]); setMainImage(0); setShowOnHome(true); setShowOnNouveautes(true); }}>Annuler</button>}
      </form>
      {error && <div style={{color:'red'}}>{error}</div>}
      <h3>Documents existants</h3>
      <ul className="doc-list">
        {documents.map(doc => (
          <li key={doc.id} style={{marginBottom:8, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <span className="doc-title">{doc.title}</span>
            <a href={`/document/${doc.id}`} target="_blank" rel="noopener noreferrer" style={{marginLeft:12, color:'#1a7f5a', fontSize:'0.98rem'}}>Lien</a>
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
  const isMobile = window.innerWidth <= 700;
  const [partenaires, setPartenaires] = useState([]);
  useEffect(() => {
    axios.get(`${API_URL}/api/partenaires`).then(res => setPartenaires(res.data));
  }, []);

  return (
    <>
      <div className="container" style={{
        paddingTop: isMobile ? 80 : 40,
        marginTop: isMobile ? 80 : 80,
        maxWidth: isMobile ? '95vw' : 1200,
        borderRadius: isMobile ? 8 : 14,
        fontSize: isMobile ? '0.95rem' : '1.1rem',
        boxShadow: isMobile ? '0 1px 6px rgba(0,0,0,0.08)' : '0 4px 24px rgba(0,0,0,0.08)',
        background: '#fff',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 32 : 48,
        padding: isMobile ? '12px 2vw 18px 2vw' : '32px',
        minHeight: '0vh',
      }}>
        <div style={{
          flex: 1,
          background: '#f8fafc',
          borderRadius: 12,
          padding: isMobile ? 20 : 32,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: isMobile ? 20 : 28,
            paddingBottom: 16,
            borderBottom: '2px solid #eafaf2',
          }}>
            <a 
              href="https://mille-univers.net/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#1a7f5a',
                fontWeight: 800,
                fontSize: isMobile ? '1.4rem' : '1.6rem',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseOver={e => e.target.style.color = '#2ecc71'}
              onMouseOut={e => e.target.style.color = '#1a7f5a'}
            >Les mille univers</a>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? 16 : 24,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: '#fff',
              padding: '12px 16px',
              borderRadius: 8,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <span style={{fontSize: '1.4rem'}}>📞</span>
              <div>
                <div style={{fontWeight: 600, color: '#1a7f5a', marginBottom: 4}}>Téléphone</div>
                <a href="tel:0248503175" style={{
                  color: '#444',
                  textDecoration: 'none',
                  fontWeight: 500,
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  transition: 'color 0.2s',
                }} onMouseOver={e => e.target.style.color = '#1a7f5a'} onMouseOut={e => e.target.style.color = '#444'}>
                  02.48.50.31.75
                </a>
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: '#fff',
              padding: '12px 16px',
              borderRadius: 8,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <span style={{fontSize: '1.4rem'}}>✉️</span>
              <div>
                <div style={{fontWeight: 600, color: '#1a7f5a', marginBottom: 4}}>Email</div>
                <a href="mailto:info@mille-univers.net" style={{
                  color: '#444',
                  textDecoration: 'none',
                  fontWeight: 500,
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  transition: 'color 0.2s',
                }} onMouseOver={e => e.target.style.color = '#1a7f5a'} onMouseOut={e => e.target.style.color = '#444'}>
                  info@mille-univers.net
                </a>
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              background: '#fff',
              padding: '12px 16px',
              borderRadius: 8,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <span style={{fontSize: '1.4rem'}}>📍</span>
              <div>
                <div style={{fontWeight: 600, color: '#1a7f5a', marginBottom: 4}}>Adresse</div>
                <div style={{color: '#444', fontSize: isMobile ? '1rem' : '1.1rem'}}>
                  32 bis, route de la Chapelle<br/>
                  18000 Bourges
                </div>
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              background: '#fff',
              padding: '12px 16px',
              borderRadius: 8,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <span style={{fontSize: '1.4rem'}}>🕒</span>
              <div>
                <div style={{fontWeight: 600, color: '#1a7f5a', marginBottom: 4}}>Horaires</div>
                <div style={{color: '#444', fontSize: isMobile ? '1rem' : '1.1rem'}}>
                  lundi – mercredi : 8h30 à 12h30, de 13h30 à 18h30<br/>
                  jeudi : 8h30 à 12h30, de 13h30 à 17h30
                </div>
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              background: '#fff',
              padding: '12px 16px',
              borderRadius: 8,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <span style={{fontSize: '1.4rem'}}>🌐</span>
              <div>
                <div style={{fontWeight: 600, color: '#1a7f5a', marginBottom: 4}}>Site web</div>
                <a
                  href="https://mille-univers.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#444',
                    textDecoration: 'none',
                    fontWeight: 500,
                    fontSize: isMobile ? '1rem' : '1.1rem',
                    transition: 'color 0.2s',
                  }}
                  onMouseOver={e => e.target.style.color = '#1a7f5a'}
                  onMouseOut={e => e.target.style.color = '#444'}
                >
                  https://mille-univers.net/
                </a>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          flex: 1,
          background: '#f8fafc',
          borderRadius: 12,
          padding: isMobile ? 20 : 32,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: isMobile ? 20 : 28,
            paddingBottom: 16,
            borderBottom: '2px solid #eafaf2',
          }}>
            <span style={{
              color: '#1a7f5a',
              fontWeight: 800,
              fontSize: isMobile ? '1.4rem' : '1.6rem',
            }}>Partenaires</span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: 16,
          }}>
            {partenaires.map((partner, i) => (
              <a
                key={partner.id || i}
                href={partner.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#fff',
                  padding: '24px',
                  borderRadius: 8,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
                }}
              >
                <div style={{
                  width: 80,
                  height: 80,
                  background: '#f8fafc',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  border: '2px solid #eafaf2',
                }}>
                  <img 
                    src={`${API_URL}${partner.image}`} 
                    alt={partner.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>
                <div style={{
                  color: '#1a7f5a',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                }}>{partner.title}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
      {/* Footer personnalisé, tout en bas */}
      <footer style={{width:'100%', marginTop:32, textAlign:'center', color:'#888', fontSize:'0.98rem', fontStyle:'italic', position:'relative'}}>
        Site web réalisé par Otohiko Fujara
      </footer>
    </>
  );
}

function GillesClement() {
  useBodyClass('gilles-bg', true);
  return (
    <div className="container" style={{maxWidth:800, margin:'40px auto', background:'#ffffff', borderRadius:18, boxShadow:'0 4px 24px rgba(0,0,0,0.08)', padding:'40px 32px', display:'flex', flexDirection:'column', alignItems:'center'}}>
      <img src={gillesClementImg} alt="Gilles Clément" style={{width:160, height:160, objectFit:'cover', borderRadius:'50%', marginBottom:24, boxShadow:'0 2px 12px rgba(0,0,0,0.10)'}} />
      <h2 style={{fontWeight:800, fontSize:'2.1rem', marginBottom:12}}>Gilles Clément</h2>
      <div style={{fontSize:'1.15rem', lineHeight:1.7, textAlign:'justify', marginBottom:24}}>
        Paysagiste, jardinier, botaniste, écrivain et enseignant français né en 1943, Gilles Clément est l'une des figures majeures de l'écologie et du paysage contemporain. Il est l'auteur des concepts de <b>Jardin en mouvement</b>, <b>Jardin planétaire</b> et <b>Tiers paysage</b>, qui invitent à repenser notre rapport au vivant, à la biodiversité et à l'espace.<br/><br/>
        Professeur au Collège de France, il a conçu de nombreux jardins publics et privés, et publié de nombreux ouvrages influents. Son approche poétique et engagée du paysage met en avant l'observation, la spontanéité, la diversité et la résistance face à la standardisation.<br/><br/>
        <span style={{fontStyle:'italic', color:'#1a7f5a', fontWeight:600}}>
          « Le jardinier est celui qui accompagne, qui observe, qui favorise la vie, sans jamais la dominer. »
        </span>
      </div>
      <a className="btn" href="https://www.gillesclement.com/index.php" target="_blank" rel="noopener noreferrer">En savoir plus</a>
    </div>
  );
}

function EcoleJardinPlanetaire() {
  useBodyClass('ecole-bg', true);
  return (
    <div className="container" style={{maxWidth:900, margin:'40px auto', background:'#fff', borderRadius:18, boxShadow:'0 4px 24px rgba(0,0,0,0.08)', padding:'40px 32px', display:'flex', flexDirection:'column', alignItems:'center'}}>
      <img src={ecoleJardinImg} alt="École du Jardin planétaire" style={{width:280, height:124, objectFit:'cover', borderRadius:16, marginBottom:24, boxShadow:'0 2px 12px rgba(0,0,0,0.10)'}} />
      <h2 style={{fontWeight:800, fontSize:'2.1rem', marginBottom:8}}>École du Jardin planétaire</h2>
      <div style={{fontWeight:600, color:'#1a7f5a', marginBottom:18, fontSize:'1.1rem'}}>Projet à Bourges</div>
      <div style={{fontSize:'1.13rem', lineHeight:1.7, textAlign:'justify', marginBottom:24, maxWidth:700}}>
        <p>L'école du jardin planétaire s'inspire du concept de <b>Jardin planétaire</b> de Gilles Clément : la Terre est un jardin à l'échelle mondiale, dont nous sommes tous les jardiniers responsables. Créée en 2003 à La Réunion, l'école sensibilise à l'écologie, au paysage et à la biodiversité, à travers une pédagogie active et sensible, en plein air.</p>
        <p>Les cours se déroulent dans des forêts, jardins, friches, parcs naturels… L'apprentissage utilise botanique, jardinage, permaculture, écologie, mais aussi poésie, arts et lectures. L'école défend une pédagogie où l'on apprend en observant, en écoutant, en vivant des expériences concrètes dans le paysage.</p>
        <div style={{margin:'18px 0', background:'#eafaf2', borderRadius:10, padding:'16px 18px', fontSize:'1.08rem'}}>
          <b>Trois principes fondamentaux :</b>
          <ul style={{margin:'10px 0 0 18px'}}>
            <li><b>Le Jardin planétaire</b> – la Terre est un jardin dont nous sommes les jardiniers.</li>
            <li><b>Le Tiers paysage</b> – les espaces délaissés sont des réservoirs de vie à protéger.</li>
            <li><b>Le Jardin en mouvement</b> – il faut accompagner la nature plutôt que la contraindre.</li>
          </ul>
        </div>
        <b>Exemples d'activités :</b>
        <ul style={{margin:'10px 0 18px 18px'}}>
          <li>Balades pédagogiques animées par des écologues, jardiniers, artistes, botanistes…</li>
          <li>Ateliers pratiques : jardinage, semis, reconnaissance de plantes, cuisine végétale…</li>
          <li>Conférences, projections, lectures sur l'écologie, le paysage, la nature et la création.</li>
          <li>Actions citoyennes : replantation, entretien d'espaces naturels, protection de la biodiversité locale.</li>
        </ul>
        <div style={{margin:'18px 0', background:'#f3f3f3', borderRadius:10, padding:'16px 18px', fontSize:'1.08rem'}}>
          <b>Les écoles du jardin planétaire dans le monde :</b>
          <ul style={{margin:'10px 0 0 18px'}}>
            <li><b>Saline royale d’Arc-et-Senans</b> (Bourgogne‑Franche‑Comté)</li>
            <li><b>Italie</b> (pas d'adresse)</li>
            <li><b>Saint-Herblain</b> (Loire-Atlantique)</li>
            <li><b>Limoges</b> (Nouvelle-Aquitaine)</li>
            <li><b>Viry-Châtillon</b> (Esonne, Île-de-France)</li>
            <li><b>Valsaintes</b> (Alpes-de-Haute-Provence)</li>
            <li><b>Saint-Paul</b> (La Réunion)</li>
            <li><b>Parc Henri Matisse</b> - l’île Derborence</li>
            <li><b>Jardin du Tiers Paysage</b> : Saint-Nazaire</li>
          </ul>
        </div>
        <div style={{fontStyle:'italic', color:'#1a7f5a', fontWeight:600, margin:'18px 0 0 0', fontSize:'1.08rem'}}>
          « Le Jardin planétaire est une invitation à prendre soin de la Terre comme d'un jardin commun, à cultiver la diversité et à inventer de nouveaux modes de cohabitation avec le vivant. »
        </div>
      </div>
      <div style={{display:'flex', gap:16, flexWrap:'wrap', justifyContent:'center', marginBottom:12}}>
        <a className="btn" href="https://www.gillesclement.com/index.php" target="_blank" rel="noopener noreferrer">Site de Gilles Clément</a>
      </div>
    </div>
  );
}

function TiersPaysage() {
  useBodyClass('tiers-bg', true);
  const isMobile = window.innerWidth <= 700;
  return (
    <div className="container" style={{maxWidth:800, margin:'40px auto', background:'#fff', borderRadius:18, boxShadow:'0 4px 24px rgba(0,0,0,0.08)', padding:'40px 32px', display:'flex', flexDirection:'column', alignItems:'center'}}>
      <div style={{
        width: '100%',
        height: isMobile ? 300 : 400,
        marginBottom: 32,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
      }}>
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2689.1234567890123!2d2.4143868!3d47.1053548!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47fa969e2e2e2e2e%3A0x0!2sRue%20Th%C3%A9ophile%20Gautier%2C%2018000%20Bourges%2C%20France!5e0!3m2!1sfr!2sfr!4v1710000000000!5m2!1sfr!2sfr"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>

      <h2 style={{fontWeight:800, fontSize: isMobile ? '2rem' : '2.1rem', marginBottom:12, color:'#1a7f5a'}}>Le Tiers paysage</h2>

      <div style={{marginBottom: 18, fontSize: isMobile ? '1rem' : '1.13rem', color: '#1a7f5a', fontWeight: 500, textAlign: 'center'}}>
        Ce Tiers paysage est situé à <b>Bourges</b> et est géré par <a href="https://mille-univers.net/" target="_blank" rel="noopener noreferrer" style={{color:'#1a7f5a', textDecoration:'underline', fontWeight:700}}>les mille univers</a>.
      </div>

      <div style={{fontSize:'1.15rem', lineHeight:1.7, textAlign:'justify', marginBottom:24}}>
        <p><b>Le Tiers paysage de Bourges</b> est un espace naturel d'environ un hectare, laissé en libre évolution&nbsp;: ici, la nature s'exprime sans intervention humaine, offrant un refuge à la biodiversité locale. Ce site, que l'on ne "touche pas", est le sujet de ce site web et une invitation à observer la richesse du vivant quand on laisse faire la nature.</p>
        <p><b>Le Tiers paysage</b> est un concept développé par Gilles Clément pour désigner l'ensemble des espaces délaissés, non exploités ou laissés à l'abandon par l'homme&nbsp;: friches, bords de route, talus, ruines, berges, interstices urbains…</p>
        <p>Ces lieux, souvent considérés comme sans valeur, sont en réalité de véritables refuges pour la biodiversité. Ils accueillent une grande variété d'espèces végétales et animales, parfois rares ou menacées, qui trouvent là un espace de liberté, loin des contraintes de l'agriculture intensive ou de l'urbanisation.</p>

        <div style={{fontStyle:'italic', color:'#1a7f5a', fontWeight:600, margin:'18px 0 0 0', fontSize:'1.08rem'}}>
          «&nbsp;Tout change tout le temps. Tout évolue. Tout se transforme. Rien n'est figé. La stabilité est une illusion&nbsp;» Gilles Clément
          <br/>
        </div>
        <div style={{margin:'18px 0', background:'#eafaf2', borderRadius:10, padding:'16px 18px', fontSize:'1.08rem'}}>
          <b>Le Tiers paysage, c'est&nbsp;:</b>
          <ul style={{margin:'10px 0 0 18px'}}>
            <li>Les <b>zones de transition</b> entre ville et campagne, entre nature et culture.</li>
            <li>Les <b>espaces oubliés</b> qui échappent à la gestion humaine.</li>
            <li>Un <b>laboratoire vivant</b> où la nature s'exprime librement.</li>
          </ul>
        </div>
        <p>Pour Gilles Clément, le Tiers paysage est un patrimoine commun, à préserver et à observer. Il invite à changer notre regard sur ces lieux, à y voir une richesse écologique et une source d'inspiration pour repenser notre rapport au vivant.</p>
        <div style={{fontStyle:'italic', color:'#1a7f5a', fontWeight:600, margin:'18px 0 0 0', fontSize:'1.08rem'}}>
          «&nbsp;Le Tiers paysage, c'est l'espace du possible, le territoire de l'inattendu, le réservoir de la diversité.&nbsp;»
        </div>
      <div style={{display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 24, justifyContent: 'center', alignItems: 'center', margin: '32px 0'}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <img
            src="/croquis2.png"
            alt="Croquis Tiers paysage 2"
            style={{
              maxWidth: isMobile ? '99vw' : 340,
              width: '100%',
              borderRadius: 10,
              boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
              marginBottom: isMobile ? 16 : 0,
              cursor: 'zoom-in',
              transition: 'transform 0.2s'
            }}
            onClick={e => {
              const modal = document.createElement('div');
              modal.style.position = 'fixed';
              modal.style.top = 0;
              modal.style.left = 0;
              modal.style.width = '100vw';
              modal.style.height = '100vh';
              modal.style.background = 'rgba(0,0,0,0.85)';
              modal.style.display = 'flex';
              modal.style.alignItems = 'center';
              modal.style.justifyContent = 'center';
              modal.style.zIndex = 9999;
              modal.style.cursor = 'zoom-out';
              modal.onclick = () => document.body.removeChild(modal);

              const img = document.createElement('img');
              img.src = 'croquis2.png';
              img.alt = "Croquis Tiers paysage 2";
              img.style.maxWidth = '96vw';
              img.style.maxHeight = '92vh';
              img.style.borderRadius = '14px';
              img.style.boxShadow = '0 4px 32px rgba(0,0,0,0.25)';
              img.style.background = '#fff';
              img.onclick = ev => ev.stopPropagation();

              modal.appendChild(img);
              document.body.appendChild(modal);
            }}
          />
          <div style={{fontSize: '0.8rem', color: '#666', marginTop: 8, fontStyle: 'italic'}}>© Gilles Clément 2023</div>
        </div>
      </div>
      </div>
      <a className="btn" href="https://www.gillesclement.com/files/974_manifeste-du-tiers-paysage.pdf" target="_blank" rel="noopener noreferrer">En savoir plus</a>
    </div>
  );
}

function Releve() {
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [releves, setReleves] = useState([]);
  const [relevesPrev, setRelevesPrev] = useState([]);
  const [relevesBeforePrev, setRelevesBeforePrev] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const isMobile = window.innerWidth <= 700;
  useBodyClass('', false);
  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get(`${API_URL}/api/releves?annee=${annee}`),
      axios.get(`${API_URL}/api/releves?annee=${annee-1}`),
      axios.get(`${API_URL}/api/releves?annee=${annee-2}`)
    ]).then(([res, prev, beforePrev]) => {
      setReleves(res.data);
      setRelevesPrev(prev.data);
      setRelevesBeforePrev(beforePrev.data);
      setLoading(false);
    });
  }, [annee]);
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear + 1; y >= 2023; y--) years.push(y);
  const prevSet = new Set(relevesPrev.map(r => r.type+':'+r.nom));
  const currSet = new Set(releves.map(r => r.type+':'+r.nom));
  const beforePrevSet = new Set(relevesBeforePrev.map(r => r.type+':'+r.nom));
  const typeOrder = { plante: 1, faune: 2, flore: 3, autre: 4 };
  const sorted = useMemo(() => {
    return [...releves].sort((a, b) => typeOrder[a.type]-typeOrder[b.type] || a.nom.localeCompare(b.nom));
  }, [releves]);
  const disparus = relevesPrev.filter(r => !currSet.has(r.type+':'+r.nom));
  const reapparus = releves.filter(r => !prevSet.has(r.type+':'+r.nom) && beforePrevSet.has(r.type+':'+r.nom));
  const getStatus = r => {
    const isNouveau = !prevSet.has(r.type+':'+r.nom);
    const isReapparu = !prevSet.has(r.type+':'+r.nom) && beforePrevSet.has(r.type+':'+r.nom);
    if (isNouveau && !isReapparu) return 'nouveau';
    if (isReapparu) return 'reapparu';
    return 'normal';
  };
  let filtered = sorted.filter(r => {; 
    const effectiveType = r.type === 'plante' ? 'flore' : r.type;
    if (typeFilter !== 'all' && effectiveType !== typeFilter) return false;
    if (statusFilter !== 'all') {
      const s = getStatus(r);
      if (statusFilter === 'nouveau' && s !== 'nouveau') return false;
      if (statusFilter === 'reapparu' && s !== 'reapparu') return false;
      if (statusFilter === 'disparu') return false;
      if (statusFilter === 'normal' && (s === 'nouveau' || s === 'reapparu')) return false;
    }
    if (search) {
      const searchLower = search.toLowerCase();
      return r.nom.toLowerCase().includes(searchLower) || 
             (r.description && r.description.toLowerCase().includes(searchLower));
    }
    return true;
  });

  const filteredDisparus = disparus.filter(r => {
    const effectiveType = r.type === 'plante' ? 'flore' : r.type;
    return typeFilter === 'all' || effectiveType === typeFilter;
  });

  const total = sorted.length;
  const totalDisparus = filteredDisparus.length;
  const totalNouveaux = sorted.filter(r => !prevSet.has(r.type+':'+r.nom)).length;
  const totalReapparus = reapparus.length;
  const [popupNom, setPopupNom] = useState(null);
  const [hasImage, setHasImage] = useState({});
  const getImageKey = r => {
    if (r.type === 'faune') {
      const desc = (r.description || '').trim();
      return desc ? desc : r.nom;
    }
    return r.description || r.nom;
  };

  useEffect(() => {
    const checkImages = async () => {
      const result = {};
      for (const r of sorted) {
        const key = getImageKey(r);
        const imgUrl = `https://raw.githubusercontent.com/otoz1/images/refs/heads/main/${encodeURIComponent(key)}/1.jpg`;
        try {
          const resp = await fetch(imgUrl, { method: 'HEAD' });
          result[key] = resp.ok;
        } catch {
          result[key] = false;
        }
      }
      setHasImage(result);
    };
    checkImages();
  }, [releves]);

  return (
    <div className="container" style={{
      paddingTop: isMobile ? 80 : 40,
      marginTop: isMobile ? 80 : 40,
      maxWidth: isMobile ? '95vw' : 900,
      borderRadius: isMobile ? 8 : 14,
      boxShadow: isMobile ? '0 1px 6px rgba(0,0,0,0.08)' : '0 4px 24px rgba(0,0,0,0.07)',
      padding: isMobile ? '12px 2vw 18px 2vw' : '40px 32px',
      minHeight: '100vh',
    }}>
      <h2 style={{
        fontWeight: 800,
        fontSize: isMobile ? '1.25rem' : '2rem',
        marginBottom: isMobile ? 12 : 18,
        color: '#1a7f5a',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginTop: isMobile ? 0 : undefined
      }}><span role="img" aria-label="relevé">🌱</span> Relevé flore & faune 🦔</h2>

      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: isMobile ? 12 : 18,
        marginBottom: isMobile ? 16 : 18,
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: isMobile ? '1 1 100%' : '0 1 auto' }}>
          <label style={{ display: 'block', marginBottom: isMobile ? 4 : 8, fontSize: isMobile ? '0.9rem' : '1rem' }}>Année : </label>
          <select 
            value={annee} 
            onChange={e=>setAnnee(Number(e.target.value))} 
            style={{
              fontSize: isMobile ? '0.9rem' : '1.1rem',
              padding: isMobile ? '8px' : '6px 12px',
              borderRadius: 6,
              border: '1px solid #ccc',
              width: isMobile ? '100%' : 'auto'
            }}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div style={{ flex: isMobile ? '1 1 100%' : '0 1 auto' }}>
          <label style={{ display: 'block', marginBottom: isMobile ? 4 : 8, fontSize: isMobile ? '0.9rem' : '1rem' }}>Type : </label>
          <select 
            value={typeFilter} 
            onChange={e=>setTypeFilter(e.target.value)} 
            style={{
              fontSize: isMobile ? '0.9rem' : '1.1rem',
              padding: isMobile ? '8px' : '6px 12px',
              borderRadius: 6,
              border: '1px solid #ccc',
              width: isMobile ? '100%' : 'auto'
            }}
          >
            <option value="all">Tous</option>
            <option value="faune">Faune</option>
            <option value="flore">Flore</option>
            <option value="autre">Autre</option>
          </select>
        </div>

        <div style={{ flex: isMobile ? '1 1 100%' : '0 1 auto' }}>
          <label style={{ display: 'block', marginBottom: isMobile ? 4 : 8, fontSize: isMobile ? '0.9rem' : '1rem' }}>Statut : </label>
          <select 
            value={statusFilter} 
            onChange={e=>setStatusFilter(e.target.value)} 
            style={{
              fontSize: isMobile ? '0.9rem' : '1.1rem',
              padding: isMobile ? '8px' : '6px 12px',
              borderRadius: 6,
              border: '1px solid #ccc',
              width: isMobile ? '100%' : 'auto'
            }}
          >
            <option value="all">Tous</option>
            <option value="nouveau">Nouveaux</option>
            <option value="reapparu">Réapparus</option>
            <option value="disparu">Disparus</option>
            <option value="normal">Déjà présents</option>
          </select>
        </div>

        <div style={{ flex: isMobile ? '1 1 100%' : '0 1 auto' }}>
          <label style={{ display: 'block', marginBottom: isMobile ? 4 : 8, fontSize: isMobile ? '0.9rem' : '1rem' }}>Recherche : </label>
          <input 
            type="text" 
            placeholder="Recherche par nom..." 
            value={search} 
            onChange={e=>setSearch(e.target.value)} 
            style={{
              fontSize: isMobile ? '0.9rem' : '1.1rem',
              padding: isMobile ? '8px' : '6px 12px',
              borderRadius: 6,
              border: '1px solid #ccc',
              width: isMobile ? '100%' : 'auto'
            }}
          />
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: isMobile ? 8 : 18,
        marginBottom: isMobile ? 16 : 18,
        flexWrap: 'wrap',
        justifyContent: isMobile ? 'space-between' : 'flex-start'
      }}>
        <span style={{
          background: '#eafaf2',
          color: '#1a7f5a',
          fontWeight: 700,
          fontSize: isMobile ? '0.9rem' : '1.05rem',
          borderRadius: 6,
          padding: isMobile ? '4px 8px' : '4px 12px'
        }}>Total : {total}</span>
        <span style={{
          background: '#ffecb3',
          color: '#ff9800',
          fontWeight: 700,
          fontSize: isMobile ? '0.9rem' : '1.05rem',
          borderRadius: 6,
          padding: isMobile ? '4px 8px' : '4px 12px'
        }}>Nouveau{totalNouveaux > 1 ? 'x' : ''} : {totalNouveaux}</span>
        <span style={{
          background: '#e3fcef',
          color: '#388e3c',
          fontWeight: 700,
          fontSize: isMobile ? '0.9rem' : '1.05rem',
          borderRadius: 6,
          padding: isMobile ? '4px 8px' : '4px 12px'
        }}>Réapparu{totalReapparus > 1 ? 's' : ''} : {totalReapparus}</span>
        <span style={{
          background: '#ffcdd2',
          color: '#b71c1c',
          fontWeight: 700,
          fontSize: isMobile ? '0.9rem' : '1.05rem',
          borderRadius: 6,
          padding: isMobile ? '4px 8px' : '4px 12px'
        }}>Disparu{totalDisparus > 1 ? 's' : ''} : {totalDisparus}</span>
      </div>

      {loading ? <div style={{color:'#888'}}>Chargement...</div> : (
        <>
        {filtered.length === 0 ? <div style={{color:'#888', fontSize: isMobile ? '0.9rem' : '1.1rem', margin:'32px 0'}}>Aucun relevé pour cette année.</div> :
        <div style={{display:'flex', flexDirection:'column', gap: isMobile ? 12 : 14}}>
          {filtered.map(r => {
            const isNouveau = !prevSet.has(r.type+':'+r.nom);
            const isReapparu = reapparus.some(x => x.type === r.type && x.nom === r.nom);
            let emoji = r.type === 'plante' ? '🌿' : r.type === 'faune' ? '🦋' : r.type === 'flore' ? '🌸' : '🍄';
            return (
              <div key={r.id} style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'center',
                background: '#f8fafc',
                borderRadius: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                padding: isMobile ? '12px' : '14px 18px',
                gap: isMobile ? 8 : 18,
                position: 'relative'
              }}>
                {/* emoji, type, nom, description, vignettes, date */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? 8 : 18,
                  width: isMobile ? '100%' : 'auto'
                }}>
                  <span style={{fontSize: isMobile ? '1.5rem' : '2rem'}}>{emoji}</span>
                  <span style={{
                    color: '#888',
                    fontSize: isMobile ? '0.9rem' : '1.05rem',
                    fontWeight: 600
                  }}>{r.type}</span>
                  <span style={{
                    fontWeight: 700,
                    fontSize: isMobile ? '1rem' : '1.15rem',
                    color: '#1a7f5a'
                  }}>{r.nom}</span>
                  <span style={{
                    color: '#444',
                    fontSize: isMobile ? '0.9rem' : '1.05rem',
                    marginLeft: isMobile ? 0 : 8
                  }}>{r.description}</span>
                  <div style={{
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                    marginLeft: isMobile ? 0 : 8
                  }}>
                    {isNouveau && !isReapparu && (
                      <span style={{
                        background: '#ffb300',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: isMobile ? '0.8rem' : '0.93rem',
                        borderRadius: 6,
                        padding: '2px 8px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.10)'
                      }}>nouveau</span>
                    )}
                    {isReapparu && (
                      <span style={{
                        background: '#1a7f5a',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: isMobile ? '0.8rem' : '0.93rem',
                        borderRadius: 6,
                        padding: '2px 8px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.10)'
                      }}>réapparu en {annee}</span>
                    )}
                    {r.protege && (
                      <span style={{
                        background: '#2196f3',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: isMobile ? '0.8rem' : '0.93rem',
                        borderRadius: 6,
                        padding: '2px 8px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.10)'
                      }}>protégé</span>
                    )}
                  </div>
                  <span style={{
                    color: '#888',
                    fontSize: isMobile ? '0.85rem' : '0.98rem',
                    marginLeft: isMobile ? 0 : 8
                  }}>{r.annee}</span>
                </div>
                <div style={{position: 'absolute', right: isMobile ? 8 : 18, top: isMobile ? 8 : 18}}>
                  <button
                    className="btn"
                    style={{marginLeft: 8, background: 'transparent', border: 'none', width: 28, height: 28, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'none'}}
                    onClick={() => setPopupNom(getImageKey(r))}
                    title="Voir les images"
                  >
                    <img src={viewIcon} alt="voir" style={{width: 30, height: 17, opacity: 0.3}} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>}

        {(statusFilter === 'all' || statusFilter === 'disparu') && filteredDisparus.length > 0 && (
          <div style={{marginTop: isMobile ? 24 : 32}}>
            <h3 style={{
              color: '#b71c1c',
              fontWeight: 700,
              fontSize: isMobile ? '1rem' : '1.15rem',
              marginBottom: isMobile ? 8 : 12
            }}>Disparus en {annee}</h3>
            <div style={{display:'flex', flexDirection:'column', gap: isMobile ? 12 : 14}}>
              {filteredDisparus.map(r => {
                let emoji = r.type === 'plante' ? '🌿' : r.type === 'faune' ? '🦋' : r.type === 'flore' ? '🌸' : '🍄';
                return (
                  <div key={r.type+':'+r.nom} style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    background: '#fff3e0',
                    borderRadius: 10,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    padding: isMobile ? '12px' : '14px 18px',
                    gap: isMobile ? 8 : 18,
                    position: 'relative'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? 8 : 18,
                      width: isMobile ? '100%' : 'auto'
                    }}>
                      <span style={{fontSize: isMobile ? '1.5rem' : '2rem'}}>{emoji}</span>
                      <span style={{
                        fontWeight: 700,
                        fontSize: isMobile ? '1rem' : '1.15rem',
                        color: '#b71c1c'
                      }}>{r.nom}</span>
                      <span style={{
                        color: '#888',
                        fontSize: isMobile ? '0.9rem' : '1.05rem'
                      }}>{r.type}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      alignItems: isMobile ? 'flex-start' : 'center',
                      gap: isMobile ? 8 : 18,
                      width: isMobile ? '100%' : 'auto'
                    }}>
                      <span style={{
                        background: '#b71c1c',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: isMobile ? '0.8rem' : '0.93rem',
                        borderRadius: 6,
                        padding: '2px 8px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.10)'
                      }}>disparu en {annee}</span>
                      <span style={{
                        color: '#444',
                        fontSize: isMobile ? '0.9rem' : '1.05rem'
                      }}>{r.description}</span>
                      <span style={{
                        color: '#888',
                        fontSize: isMobile ? '0.85rem' : '0.98rem'
                      }}>{r.annee}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        </>
      )}
      {popupNom && <ImagePopup nom={popupNom} onClose={() => setPopupNom(null)} />}
    </div>
  );
}

function ImagePopup({ nom, onClose }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoomImg, setZoomImg] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchImages = async () => {
      const imgs = [];
      for (let i = 1; i <= 10; i++) {
        const url = `https://raw.githubusercontent.com/otoz1/images/refs/heads/main/${encodeURIComponent(nom)}/${i}.jpg`;
        try {
          const resp = await fetch(url, { method: 'HEAD' });
          if (resp.ok) {
            imgs.push(url);
          } else {
            break;
          }
        } catch {
          break;
        }
      }
      if (isMounted) {
        setImages(imgs);
        setLoading(false);
      }
    };
    fetchImages();
    return () => { isMounted = false; };
  }, [nom]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: 24, maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 32px rgba(0,0,0,0.25)', position: 'relative'
      }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 24, right: 32, background: '#1a7f5a', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 700, cursor: 'pointer', fontSize: '1.1rem', zIndex: 2
        }}>Fermer</button>
        <h3 style={{marginBottom: 18, color: '#1a7f5a'}}>{nom}</h3>
        {loading ? <div>Chargement...</div> : images.length === 0 ? <div>nous n'avons pas encore de photo pour cet élément!</div> :
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center'}}>
            {images.map((img, i) => (
              <img key={i} src={img} alt={`photo ${i+1}`} style={{maxWidth: 220, maxHeight: 220, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.10)', cursor: 'zoom-in'}} onClick={() => setZoomImg(img)} />
            ))}
          </div>
        }
        {zoomImg && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.93)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }} onClick={() => setZoomImg(null)}>
            <img src={zoomImg} alt="zoom" style={{maxWidth: '95vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 4px 32px rgba(0,0,0,0.25)', cursor: 'zoom-out'}} onClick={e => e.stopPropagation()} />
            <button onClick={() => setZoomImg(null)} style={{
              position: 'fixed', top: 24, right: 32, background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: 18, padding: '6px 18px', fontWeight: 700, cursor: 'pointer', fontSize: '1.5rem', zIndex: 10001
            }}>✕</button>
          </div>
        )}
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
        <Route path="/releve" element={<Releve />} />
        <Route path="/tiers-paysage" element={<TiersPaysage />} />
        <Route path="/document/:id" element={<DocumentDetail />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/gilles-clement" element={<GillesClement />} />
        <Route path="/ecole-jardin-planetaire" element={<EcoleJardinPlanetaire />} />
      </Routes>
    </Router>
  );
}

export default App;