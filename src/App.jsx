import { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

function App() {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    confirmerMotDePasse: '',
    sexe: 'femme',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Gestion de l'authentification au chargement
  useEffect(() => {
    if (!auth) {
      setMessage("Erreur : Le SDK Firebase n'est pas initialisé. Vérifiez vos variables d'environnement.");
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        signInAnonymously(auth).catch((error) => {
          console.error("Erreur d'authentification anonyme:", error);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const validateField = (name, value, allData = formData) => {
    let error = '';
    switch (name) {
      case 'nom':
      case 'prenom':
        if (value.trim().length < 2) error = 'Minimum 2 caractères.';
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) error = 'Email invalide.';
        break;
      case 'motDePasse':
        if (value.length < 6) error = 'Minimum 6 caractères.';
        break;
      case 'confirmerMotDePasse':
        if (value !== allData.motDePasse) error = 'Les mots de passe ne correspondent pas.';
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (event) => {
    let { name, value } = event.target;
    
    // Capitalisation automatique pour Nom et Prénom
    if (name === 'nom' || name === 'prenom') {
      value = value.charAt(0).toUpperCase() + value.slice(1);
    }

    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);

    // Validation en temps réel
    const error = validateField(name, value, updatedData);
    setErrors((prev) => ({ ...prev, [name]: error }));

    // Si on change le mot de passe, on re-valide la confirmation
    if (name === 'motDePasse' && formData.confirmerMotDePasse) {
      const confirmError = validateField('confirmerMotDePasse', formData.confirmerMotDePasse, updatedData);
      setErrors((prev) => ({ ...prev, confirmerMotDePasse: confirmError }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key], formData);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    if (!auth.currentUser) {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        setMessage("Erreur d'authentification.");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      // On n'enregistre pas confirmerMotDePasse dans la DB
      const { confirmerMotDePasse, ...dataToSave } = formData;
      await addDoc(collection(db, "formulaire_contact"), {
        ...dataToSave,
        createdAt: serverTimestamp(),
        userId: auth.currentUser.uid
      });
      setSubmitted(true);
      setFormData({ nom: '', prenom: '', email: '', motDePasse: '', confirmerMotDePasse: '', sexe: 'femme' });
    } catch (error) {
      console.error("Erreur:", error);
      setMessage("Erreur lors de l'envoi. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <>
        <div className="marquee-container">
          <div className="marquee-text">Merci de votre confiance — Inscription réussie — À bientôt !</div>
        </div>
        <div className="container">
          <div className="success-container">
            <div className="success-icon-wrapper">✓</div>
            <h1>Succès !</h1>
            <p className="subtitle">Votre demande a été enregistrée avec succès. Nous vous contacterons bientôt.</p>
            <button onClick={() => setSubmitted(false)}>Retour au formulaire</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {!submitted && (
        <div className="marquee-container">
          <div className="marquee-text">Bienvenue dans notre formulaire — Inscrivez-vous dès maintenant pour profiter de nos services — Bienvenue dans notre formulaire</div>
        </div>
      )}
      <div className="container">
        <h1>Inscription</h1>
        <p className="subtitle">Veuillez remplir les informations ci-dessous pour nous rejoindre.</p>
        
        {message && (
          <div style={{ 
            padding: '12px', marginBottom: '24px', borderRadius: '12px', 
            backgroundColor: '#fff1f2', color: '#e11d48', textAlign: 'center',
            fontSize: '0.9rem', fontWeight: '500', border: '1px solid #ffe4e6'
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nom">Nom</label>
              <input
                id="nom" name="nom" type="text"
                className={errors.nom ? 'invalid' : ''}
                placeholder="Ex: Dupont"
                value={formData.nom}
                onChange={handleChange}
                required
              />
              <div className="error-message">{errors.nom}</div>
            </div>

            <div className="form-group">
              <label htmlFor="prenom">Prénom</label>
              <input
                id="prenom" name="prenom" type="text"
                className={errors.prenom ? 'invalid' : ''}
                placeholder="Ex: Jean"
                value={formData.prenom}
                onChange={handleChange}
                required
              />
              <div className="error-message">{errors.prenom}</div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email professionnel</label>
            <input
              id="email" name="email" type="email"
              className={errors.email ? 'invalid' : ''}
              placeholder="jean.dupont@exemple.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <div className="error-message">{errors.email}</div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="motDePasse">Mot de passe</label>
              <div className="password-input-wrapper">
                <input
                  id="motDePasse" name="motDePasse" 
                  type={showPassword ? "text" : "password"}
                  className={errors.motDePasse ? 'invalid' : ''}
                  placeholder="6+ caractères"
                  value={formData.motDePasse}
                  onChange={handleChange}
                  required
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Masquer" : "Voir"}
                </button>
              </div>
              <div className="error-message">{errors.motDePasse}</div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmerMotDePasse">Confirmation</label>
              <input
                id="confirmerMotDePasse" name="confirmerMotDePasse" 
                type={showPassword ? "text" : "password"}
                className={errors.confirmerMotDePasse ? 'invalid' : ''}
                placeholder="Répétez"
                value={formData.confirmerMotDePasse}
                onChange={handleChange}
                required
              />
              <div className="error-message">{errors.confirmerMotDePasse}</div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="sexe">Sexe</label>
            <select id="sexe" name="sexe" value={formData.sexe} onChange={handleChange}>
              <option value="femme">Femme</option>
              <option value="homme">Homme</option>
              <option value="autre">Autre</option>
            </select>
            <div className="error-message"></div>
          </div>

          <button type="submit" disabled={isSubmitting || Object.values(errors).some(e => e)}>
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Traitement...
              </>
            ) : "Créer mon compte"}
          </button>
        </form>
      </div>
    </>
  );
}

export default App;
