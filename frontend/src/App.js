import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './App.css';
import gillesClementImg from './gilles-clement.png';
import ecoleJardinImg from './ecole-jardin.png';
import croquis1Img from './croquis1.png';
import croquis2Img from './croquis2.png';


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
      <Link className="logo" to="/">Tiers paysage Bourges</Link>
      <nav>
        <Link className={isHome ? 'active' : ''} to="/">Accueil</Link>
        <Link className={location.pathname==='/nouveautes' ? 'active' : ''} to="/nouveautes">Actualités</Link>
        <Link className={location.pathname==='/tiers-paysage' ? 'active' : ''} to="/tiers-paysage">Tiers paysage</Link>
        <Link className={location.pathname==='/gilles-clement' ? 'active' : ''} to="/gilles-clement">Gilles Clément</Link>
        <Link className={location.pathname==='/ecole-jardin-planetaire' ? 'active' : ''} to="/ecole-jardin-planetaire">École du Jardin Planétaire</Link>
        <Link className={location.pathname==='/contact' ? 'active' : ''} to="/contact">Contact</Link>
      </nav>
    </div>
  );
}

function Home() {
  const [documents, setDocuments] = useState([]);
  const [current, setCurrent] = useState(0);
  const [next, setNext] = useState(null);
  const [sliding, setSliding] = useState(false);
  const [bgImage, setBgImage] = useState('');
  const [progress, setProgress] = useState(0);
  useBodyClass('home-bg', true);
  useEffect(() => {
    axios.get(`${API_URL}/api/documents`).then(res => setDocuments(res.data));
  }, []);
  useEffect(() => {
    if (documents.length < 2) return;
    let frame;
    let start;
    function animateBar(ts) {
      if (!start) start = ts;
      const elapsed = ts - start;
      setProgress(Math.min(elapsed / 15000, 1));
      if (elapsed < 15000) {
        frame = requestAnimationFrame(animateBar);
      }
    }
    setProgress(0);
    frame = requestAnimationFrame(animateBar);
    return () => cancelAnimationFrame(frame);
  }, [documents, current]);
  useEffect(() => {
    if (documents.length < 2) return;
    const timer = setInterval(() => {
      const nextIdx = (current + 1) % documents.length;
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
  const currDoc = documents[current];
  const nextDoc = next !== null ? documents[next] : null;

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
      <div style={{position:'relative', width:'100vw', height:420, display:'flex', alignItems:'center'}}>
        <div
          className={sliding ? 'carousel-slide-box slide-left' : 'carousel-slide-box'}
          style={{
            position:'absolute',
            left:0,
            top:0,
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
            transition: 'none',
          }}
        >
          <div style={{fontWeight:700, fontSize:'1.1rem', marginBottom:10}}>Dernière actualité</div>
          <h1 style={{fontSize:'2.3rem', fontWeight:700, marginBottom:18}}>{currDoc?.title}</h1>
          <div style={{fontSize:'1.15rem', marginBottom:28, color:'#e0e0e0'}}>
            <span style={{fontWeight:700}}>{currExcerpt.boldPart}</span>{currExcerpt.rest}{currExcerpt.isLong && '...'}
          </div>
          {currDoc && <Link className="btn" style={{fontSize:'1.1rem', padding:'13px 30px'}} to={`/document/${currDoc.id}`}>En savoir plus</Link>}
        </div>
        {sliding && nextDoc && (
          <div
            className="carousel-slide-box slide-in"
            style={{
              position:'absolute',
              left:0,
              top:0,
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
              transition: 'none',
            }}
          >
            <div style={{fontWeight:700, fontSize:'1.1rem', marginBottom:10}}>Dernière actualité</div>
            <h1 style={{fontSize:'2.3rem', fontWeight:700, marginBottom:18}}>{nextDoc.title}</h1>
            <div style={{fontSize:'1.15rem', marginBottom:28, color:'#e0e0e0'}}>
              <span style={{fontWeight:700}}>{nextExcerpt.boldPart}</span>{nextExcerpt.rest}{nextExcerpt.isLong && '...'}
            </div>
            <Link className="btn" style={{fontSize:'1.1rem', padding:'13px 30px'}} to={`/document/${nextDoc.id}`}>En savoir plus</Link>
          </div>
        )}
      </div>
      {/* Barre de chargement discrète */}
      <div style={{
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
          width: `${Math.round(progress * 100)}vw`,
          background: 'linear-gradient(90deg, #1a7f5a 60%, #e0e0e0 100%)',
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

function GillesClement() {
  useBodyClass('gilles-bg', true);
  return (
    <div className="container" style={{maxWidth:800, margin:'40px auto', background:'#f7f7f7cc', borderRadius:18, boxShadow:'0 4px 24px rgba(0,0,0,0.08)', padding:'40px 32px', display:'flex', flexDirection:'column', alignItems:'center'}}>
      <img src={gillesClementImg} alt="Gilles Clément" style={{width:160, height:160, objectFit:'cover', borderRadius:'50%', marginBottom:24, boxShadow:'0 2px 12px rgba(0,0,0,0.10)'}} />
      <h2 style={{fontWeight:800, fontSize:'2.1rem', marginBottom:12}}>Gilles Clément</h2>
      <div style={{fontSize:'1.15rem', lineHeight:1.7, textAlign:'justify', marginBottom:24}}>
        Paysagiste, jardinier, botaniste, écrivain et enseignant français né en 1943, Gilles Clément est l'une des figures majeures de l'écologie et du paysage contemporain. Il est l'auteur des concepts de <b>Jardin en Mouvement</b>, <b>Jardin Planétaire</b> et <b>Tiers Paysage</b>, qui invitent à repenser notre rapport au vivant, à la biodiversité et à l'espace.<br/><br/>
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
    <div className="container" style={{maxWidth:900, margin:'40px auto', background:'#f7f7f7cc', borderRadius:18, boxShadow:'0 4px 24px rgba(0,0,0,0.08)', padding:'40px 32px', display:'flex', flexDirection:'column', alignItems:'center'}}>
      <img src={ecoleJardinImg} alt="École du Jardin Planétaire" style={{width:280, height:124, objectFit:'cover', borderRadius:16, marginBottom:24, boxShadow:'0 2px 12px rgba(0,0,0,0.10)'}} />
      <h2 style={{fontWeight:800, fontSize:'2.1rem', marginBottom:8}}>École du Jardin Planétaire</h2>
      <div style={{fontWeight:600, color:'#1a7f5a', marginBottom:18, fontSize:'1.1rem'}}>Projet à Bourges – ouverture prévue 2028</div>
      <div style={{fontSize:'1.13rem', lineHeight:1.7, textAlign:'justify', marginBottom:24, maxWidth:700}}>
        <p>L'école du jardin planétaire s'inspire du concept de <b>Jardin Planétaire</b> de Gilles Clément : la Terre est un jardin à l'échelle mondiale, dont nous sommes tous les jardiniers responsables. Créée en 2003 à La Réunion, l'école sensibilise à l'écologie, au paysage et à la biodiversité, à travers une pédagogie active et sensible, en plein air.</p>
        <p>Les cours se déroulent dans des forêts, jardins, friches, parcs naturels… L'apprentissage utilise botanique, jardinage, permaculture, écologie, mais aussi poésie, arts et lectures. L'école défend une pédagogie où l'on apprend en observant, en écoutant, en vivant des expériences concrètes dans le paysage.</p>
        <div style={{margin:'18px 0', background:'#eafaf2', borderRadius:10, padding:'16px 18px', fontSize:'1.08rem'}}>
          <b>Trois principes fondamentaux :</b>
          <ul style={{margin:'10px 0 0 18px'}}>
            <li><b>Le Jardin Planétaire</b> – la Terre est un jardin dont nous sommes les jardiniers.</li>
            <li><b>Le Tiers Paysage</b> – les espaces délaissés sont des réservoirs de vie à protéger.</li>
            <li><b>Le Jardin en Mouvement</b> – il faut accompagner la nature plutôt que la contraindre.</li>
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
            <li><b>La Réunion</b> : sensibilisation à la biodiversité, balades, ateliers, formation de citoyens engagés.</li>
            <li><b>Saline royale d'Arc-et-Senans (Doubs)</b> : jardins pédagogiques, formations, expérimentations autour de l'écologie, de l'art et de l'histoire.</li>
            <li><b>Roumanie (Brezoi)</b> : éducation environnementale autour des friches, forêts urbaines, terrains vagues, réconciliation nature/ville.</li>
            <li><b>Italie (Toscane)</b> : réflexion écologique et artistique sur la gestion des paysages méditerranéens, valorisation de la biodiversité locale.</li>
            <li><b>Abbaye de Valsaintes</b> : restauration de serres, préservation de 12 000 espèces végétales, espace pédagogique sur le climat et la biodiversité.</li>
          </ul>
        </div>
        <div style={{fontStyle:'italic', color:'#1a7f5a', fontWeight:600, margin:'18px 0 0 0', fontSize:'1.08rem'}}>
          « Le Jardin Planétaire est une invitation à prendre soin de la Terre comme d'un jardin commun, à cultiver la diversité et à inventer de nouveaux modes de cohabitation avec le vivant. »
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
  return (
    <div className="container" style={{maxWidth:800, margin:'40px auto', background:'#f7f7f7cc', borderRadius:18, boxShadow:'0 4px 24px rgba(0,0,0,0.08)', padding:'40px 32px', display:'flex', flexDirection:'column', alignItems:'center'}}>
      <h2 style={{fontWeight:800, fontSize:'2.1rem', marginBottom:12, color:'#1a7f5a'}}>Le Tiers paysage</h2>
      <div style={{fontSize:'1.15rem', lineHeight:1.7, textAlign:'justify', marginBottom:24}}>
        <p style={{background:'#eafaf2', borderRadius:10, padding:'14px 18px', marginBottom:24}}><b>Le Tiers paysage de Bourges</b> est un espace naturel d'environ un hectare, laissé en libre évolution&nbsp;: ici, la nature s'exprime sans intervention humaine, offrant un refuge à la biodiversité locale. Ce site, que l'on ne "touche pas", est le sujet de ce site web et une invitation à observer la richesse du vivant quand on laisse faire la nature.</p>
        <p><b>Le Tiers paysage</b> est un concept développé par Gilles Clément pour désigner l'ensemble des espaces délaissés, non exploités ou laissés à l'abandon par l'homme&nbsp;: friches, bords de route, talus, ruines, berges, interstices urbains…</p>
        <p>Ces lieux, souvent considérés comme sans valeur, sont en réalité de véritables refuges pour la biodiversité. Ils accueillent une grande variété d'espèces végétales et animales, parfois rares ou menacées, qui trouvent là un espace de liberté, loin des contraintes de l'agriculture intensive ou de l'urbanisation.</p>
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
      </div>
      <a className="btn" href="https://www.gillesclement.com/files/974_manifeste-du-tiers-paysage.pdf" target="_blank" rel="noopener noreferrer">En savoir plus</a>
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