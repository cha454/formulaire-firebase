import { useState, useEffect } from 'react';
import { db, auth } from './firebase'; // Import de la base de données et auth
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; // Fonctions Firestore
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth'; // Authentification

function App() {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    sexe: 'femme',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);

  // Gestion de l'authentification au chargement
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        console.log("Utilisateur connecté anonymement:", currentUser.uid);
      } else {
        // Tentative de connexion anonyme pour respecter les règles Firestore
        signInAnonymously(auth).catch((error) => {
          console.error("Erreur d'authentification anonyme:", error);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    // Vérification de l'auth avant envoi
    if (!auth.currentUser) {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        setMessage("Erreur d'authentification. Impossible d'envoyer les données.");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      // Ajout des données dans la nouvelle collection "formulaire_contact"
      const docRef = await addDoc(collection(db, "formulaire_contact"), {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        sexe: formData.sexe,
        createdAt: serverTimestamp(), // Utilisation du timestamp serveur
        userId: auth.currentUser.uid // Référence de l'utilisateur
      });

      console.log("Document écrit avec l'ID: ", docRef.id);
      alert(`Merci ! Votre demande a été enregistrée (ID: ${docRef.id})`);
      
      // Réinitialisation du formulaire
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        motDePasse: '',
        sexe: 'femme',
      });
      setMessage('Données envoyées avec succès vers la nouvelle collection !');
    } catch (error) {
      console.error("Erreur lors de l'ajout du document: ", error);
      setMessage("Erreur lors de l'envoi. Vérifiez les règles Firestore de votre projet 'cdoc-manager-82cbd'.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <h1>Contact & Devis</h1>
      
      {message && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '20px', 
          borderRadius: '4px', 
          backgroundColor: message.includes('Erreur') ? '#ffebee' : '#e8f5e9',
          color: message.includes('Erreur') ? '#c62828' : '#2e7d32',
          textAlign: 'center',
          fontSize: '0.9rem'
        }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nom">Nom</label>
          <input
            id="nom"
            name="nom"
            type="text"
            placeholder="Votre nom"
            value={formData.nom}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="prenom">Prénom</label>
          <input
            id="prenom"
            name="prenom"
            type="text"
            placeholder="Votre prénom"
            value={formData.prenom}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="exemple@mail.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="motDePasse">Mot de passe</label>
          <input
            id="motDePasse"
            name="motDePasse"
            type="password"
            placeholder="••••••••"
            value={formData.motDePasse}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="sexe">Sexe</label>
          <select
            id="sexe"
            name="sexe"
            value={formData.sexe}
            onChange={handleChange}
          >
            <option value="femme">Femme</option>
            <option value="homme">Homme</option>
            <option value="autre">Autre</option>
          </select>
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Envoi en cours...' : "Envoyer ma demande"}
        </button>
      </form>
    </div>
  );
}

export default App;
