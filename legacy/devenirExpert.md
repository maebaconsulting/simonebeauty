Fonctionnement "Devenir Expert"
Voici le processus complet de candidature pour devenir expert sur la plateforme :

1. Point d'entrée
   Page: /rejoindre-simone (RejoindreSimone.tsx)
   Présentation des avantages (communauté, flexibilité, excellence, support)
   Profils recherchés (coiffeurs, esthéticiennes, masseurs)
   Bouton "Postuler maintenant"
2. Formulaire de candidature en 5 étapes
   Le formulaire ApplicationForm comporte 5 sections progressives :

Étape 1 - Informations personnelles :

Prénom, Nom, Email, Téléphone, Adresse
Étape 2 - Profil professionnel :

Profession (coiffeur/esthéticienne/masseur/autre)
Années d'expérience
Diplômes et certifications
Spécialités (selon la profession)
Services proposés
Étape 3 - Disponibilités :

Zones géographiques (arrondissements Paris + banlieue)
Horaires préférés
Fréquence de travail souhaitée
Étape 4 - Motivation :

Texte libre (minimum 100 caractères)
Étape 5 - Documents :

Upload CV (optionnel)
Upload certifications (optionnel)
Upload portfolio (optionnel) 3. Traitement de la candidature
A. Upload des fichiers (useJobApplication.ts) :

Les fichiers sont uploadés dans le bucket Supabase job-applications
Structure : cv/, certifications/, portfolio/
B. Appel Edge Function (submit-job-application) qui effectue :

Enregistrement en base de données :

Table job_applications avec toutes les informations
Création d'une tâche backoffice :

Table backoffice_tasks
Type: job_application
Priorité: medium
Status: pending
Email de confirmation au candidat (via Resend) :

Récapitulatif de sa candidature
Confirmation de réception
Email de notification à l'équipe :

Envoyé à contact@simone.paris
Détails complets de la candidature
Liens vers les documents uploadés 4. Message de succès
Écran de confirmation avec icône verte
Message de remerciement
"Notre équipe va l'examiner et vous contactera" 5. Gestion post-candidature
L'équipe reçoit une tâche dans le backoffice
Accès aux documents du candidat
Suivi via le système de tâches

Fonctionnement technique du formulaire ApplicationForm

1. Architecture Multi-étapes
   Le formulaire utilise un système de 5 étapes progressives avec navigation contrôlée :

const steps = [
{ id: 1, title: 'Informations personnelles', icon: User },
{ id: 2, title: 'Profil professionnel', icon: Briefcase },
{ id: 3, title: 'Disponibilités', icon: MapPin },
{ id: 4, title: 'Motivation', icon: Heart },
{ id: 5, title: 'Documents', icon: Upload },
];
Indicateur visuel : Pills circulaires avec icônes, ligne de progression
État courant : currentStep (1-5)
Navigation : Boutons "Précédent" / "Suivant" 2. Validation Zod (Schema-based)
Schema de validation complet avec règles conditionnelles :

const applicationSchema = z.object({
email: z.string().email(),
firstName: z.string().min(2),
profession: z.enum(['coiffeur', 'estheticienne', 'masseur', 'autre']),
yearsExperience: z.number().min(0),
diplomasCertifications: z.array(z.string()).min(1),
motivation: z.string().min(100), // minimum 100 caractères
// ...
}).refine((data) => {
// Validation conditionnelle pour les champs "autre"
if (data.profession === 'autre' && !data.professionOther) return false;
// ...
});
Validation temps réel : mode: 'onChange'
Validation par étape : Fonction getFieldsForStep() qui retourne les champs à valider
Blocage navigation : Ne peut pas passer à l'étape suivante si validation échoue 3. Gestion de l'état (React Hook Form + useState)
React Hook Form pour les champs texte :

const { register, handleSubmit, formState: { errors }, setValue, watch, trigger } = useForm<ApplicationFormData>({
resolver: zodResolver(applicationSchema),
mode: 'onChange'
});
useState local pour les sélections multiples :

const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
const [selectedServices, setSelectedServices] = useState<string[]>([]);
const [selectedZones, setSelectedZones] = useState<string[]>([]);
const [selectedDiplomas, setSelectedDiplomas] = useState<string[]>([]);
useState pour les fichiers (avec callbacks mémorisés) :

const [cvFile, setCvFile] = useState<File | null>(null);
const [certificationsFile, setCertificationsFile] = useState<File | null>(null);
const [portfolioFile, setPortfolioFile] = useState<File | null>(null);

const handleSetCvFile = useCallback((file: File | null) => {
setCvFile(file);
}, []); 4. Logique conditionnelle dynamique
Champs "Autre" conditionnels :

const profession = watch('profession');
const showProfessionOther = profession === 'autre';

// Dans le rendu :
{showProfessionOther && (
<Input {...register('professionOther')} placeholder="Précisez..." />
)}
Options dynamiques selon la profession :

const specialtiesOptions = {
coiffeur: ['Coupe', 'Coloration', 'Mèches', ...],
estheticienne: ['Soins du visage', 'Épilation', ...],
masseur: ['Massage suédois', 'Réflexologie', ...],
};

// Affichage conditionnel :
{profession && specialtiesOptions[profession]?.map(...)} 5. Navigation entre étapes
Fonction nextStep() avec validation :

const nextStep = async () => {
const fieldsToValidate = getFieldsForStep(currentStep);
const isValid = await trigger(fieldsToValidate); // Validation async

if (isValid && currentStep < steps.length) {
setCurrentStep(currentStep + 1);
}
};
Fonction prevStep() sans validation :

const prevStep = () => {
if (currentStep > 1) {
setCurrentStep(currentStep - 1);
}
}; 6. Gestion des checkboxes multiples
Pattern pour chaque type de sélection :

const handleSpecialtyChange = (specialty: string, checked: boolean) => {
const updated = checked
? [...selectedSpecialties, specialty]
: selectedSpecialties.filter(s => s !== specialty);

setSelectedSpecialties(updated);
setValue('specialties', updated); // Sync avec React Hook Form
}; 7. Upload de fichiers
Composant FileUpload réutilisable :

<FileUpload
label="CV \*"
accept=".pdf,.doc,.docx"
maxSize={5} // 5MB
onFileSelect={handleSetCvFile}
file={cvFile}
/>
Validation côté client : Type et taille de fichier
Prévisualisation : Nom et taille du fichier
Suppression : Possibilité de retirer le fichier 8. Soumission du formulaire
Flux de soumission :

const onSubmit = async (data: ApplicationFormData) => {
// 1. Récupération de toutes les données
const formData = getValues();

// 2. Vérification des champs requis
if (!formData.email || !formData.firstName || ...) {
console.error('Données incomplètes');
return;
}

// 3. Construction de l'objet complet avec mapping des "autre"
const completeData = {
email: formData.email,
profession: formData.profession === 'autre'
? formData.professionOther || 'autre'
: formData.profession,
specialties: selectedSpecialties.map(s =>
s === 'Autre' ? formData.specialtiesOther || 'Autre' : s
),
cvFile: cvFile || undefined,
// ...
};

// 4. Appel au hook useJobApplication
const success = await submitApplication(completeData);

// 5. Affichage du message de succès
if (success) {
setShowSuccessMessage(true);
}
}; 9. Hook useJobApplication
Gestion de la soumission :

const submitApplication = async (data: JobApplicationData) => {
setIsSubmitting(true);

// 1. Upload des fichiers dans Supabase Storage
const cvFilePath = data.cvFile
? await uploadFile(data.cvFile, 'cv')
: null;

// 2. Appel à l'Edge Function
const { data: result, error } = await supabase.functions.invoke(
'submit-job-application',
{ body: { ...data, cvFilePath, ... } }
);

// 3. Gestion des erreurs
if (error) throw error;

// 4. Toast de succès
toast.success('Candidature envoyée avec succès !');
return true;
}; 10. États d'affichage
Trois états possibles :

Formulaire normal : Affichage des étapes
État de chargement : isSubmitting → Bouton désactivé
Message de succès : showSuccessMessage → Card de confirmation

if (showSuccessMessage) {
return (
<Card>
<CheckCircle className="text-green-600" />
<h2>Candidature envoyée !</h2>
<Button onClick={onClose}>Fermer</Button>
</Card>
);
}
