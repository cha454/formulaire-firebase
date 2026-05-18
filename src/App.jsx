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
    sexe: 'femme',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');

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

  const validateField = (name, value) => {
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
      default:
        break;
    }
    return error;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    
    // Mise à jour des données
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validation en temps réel
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Validation finale avant envoi
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
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
      await addDoc(collection(db, "formulaire_contact"), {
        ...formData,
        createdAt: serverTimestamp(),
        userId: auth.currentUser.uid
      });

      setSubmitted(true);
      setFormData({ nom: '', prenom: '', email: '', motDePasse: '', sexe: 'femme' });
    } catch (error) {
      console.error("Erreur:", error);
      setMessage("Erreur lors de l'envoi. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="container">
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h1>Merci !</h1>
          <p>Votre demande a été enregistrée avec succès.</p>
          <button onClick={() => setSubmitted(false)}>Retour au formulaire</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Contact & Devis</h1>
      
      {message && (
        <div style={{ 
          padding: '10px', marginBottom: '20px', borderRadius: '4px', 
          backgroundColor: '#ffebee', color: '#c62828', textAlign: 'center'
        }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="nom">Nom</label>
          <input
            id="nom" name="nom" type="text"
            className={errors.nom ? 'invalid' : ''}
            placeholder="Votre nom"
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
            placeholder="Votre prénom"
            value={formData.prenom}
            onChange={handleChange}
            required
          />
          <div className="error-message">{errors.prenom}</div>
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email" name="email" type="email"
            className={errors.email ? 'invalid' : ''}
            placeholder="exemple@mail.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <div className="error-message">{errors.email}</div>
        </div>

        <div className="form-group">
          <label htmlFor="motDePasse">Mot de passe</label>
          <input
            id="motDePasse" name="motDePasse" type="password"
            className={errors.motDePasse ? 'invalid' : ''}
            placeholder="Minimum 6 caractères"
            value={formData.motDePasse}
            onChange={handleChange}
            required
          />
          <div className="error-message">{errors.motDePasse}</div>
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
              Envoi en cours...
            </>
          ) : "Envoyer ma demande"}
        </button>
      </form>
    </div>
  );
}

export default App;
