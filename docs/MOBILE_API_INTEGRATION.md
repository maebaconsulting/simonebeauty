# Mobile API Integration Guide

Ce guide explique comment intégrer les APIs de réservation dans une application mobile (iOS, Android, React Native).

## 🔐 Sécurité : PostgreSQL FUNCTION au lieu de Service Role Key

L'API utilise une **PostgreSQL FUNCTION avec SECURITY DEFINER** qui permet :
- ✅ Sécurité : Logique contrôlée dans la base de données
- ✅ Performance : Une seule requête au lieu de multiples appels
- ✅ Multi-plateforme : Web, iOS, Android utilisent le même endpoint
- ✅ Pas de Service Role Key exposé

## 📱 Endpoints Disponibles

### 1. GET `/api/contractors/available`

Récupère les prestataires disponibles pour un service, date, et heure donnés.

**Paramètres** :
- `service_id` (number, requis) : ID du service
- `date` (string, requis) : Date au format YYYY-MM-DD
- `time` (string, requis) : Heure au format HH:mm
- `address_id` (number, optionnel) : ID de l'adresse pour calcul de distance

**Réponse** :
```json
{
  "contractors": [
    {
      "id": "abc5d3c5-fa39-4025-a6d1-eae47a196bbf",
      "slug": "c-an-lliwen",
      "business_name": "Mc Dan Olliwen",
      "bio": "Expert en coloration...",
      "professional_title": "Coiffeur Expert",
      "profile_picture_url": null,
      "rating": null,
      "total_bookings": 0,
      "distance_km": null,
      "specialties": [],
      "recommendation_score": null
    }
  ],
  "total": 1,
  "service": {
    "id": 1,
    "name": "Balayage",
    "duration_minutes": 135
  },
  "timeslot": {
    "date": "2025-11-13",
    "start_time": "13:30",
    "end_time": "15:45"
  }
}
```

### 2. POST `/api/contractors/assign`

Obtient une recommandation de prestataire avec score intelligent.

**Body** :
```json
{
  "service_id": 1,
  "date": "2025-11-13",
  "time": "13:30",
  "address_id": 123
}
```

**Réponse** :
```json
{
  "recommended": {
    "id": "abc5d3c5...",
    "business_name": "Mc Dan Olliwen",
    "recommendation_score": 120,
    "recommendation_reason": "Expérience vérifiée, haute disponibilité"
  },
  "alternatives": [...]
}
```

### 3. POST `/api/bookings/create`

Crée une réservation complète.

**Body** :
```json
{
  "service_id": 1,
  "address_id": 123,
  "scheduled_datetime": "2025-11-13T13:30:00",
  "booking_timezone": "Europe/Paris",
  "contractor_id": "abc5d3c5...",
  "payment_method_id": "pm_xxx"
}
```

---

## 📱 Intégration iOS (Swift)

### Installation

```bash
# Via Swift Package Manager
dependencies: [
    .package(url: "https://github.com/supabase/supabase-swift", from: "2.0.0")
]
```

### Configuration

```swift
import Supabase

let supabase = SupabaseClient(
    supabaseURL: URL(string: "https://xpntvajwrjuvsqsmizzb.supabase.co")!,
    supabaseKey: "YOUR_ANON_KEY" // Clé publique
)
```

### Utilisation : Récupérer les prestataires disponibles

#### Option A : Via l'API Next.js (Recommandé pour MVP)

```swift
import Foundation

struct ContractorResponse: Codable {
    let contractors: [Contractor]
    let total: Int
    let service: ServiceInfo?
    let timeslot: Timeslot
}

struct Contractor: Codable, Identifiable {
    let id: String
    let slug: String
    let businessName: String
    let bio: String?
    let professionalTitle: String?
    let profilePictureUrl: String?
    let rating: Double?
    let totalBookings: Int
    let distanceKm: Double?
    let specialties: [String]

    enum CodingKeys: String, CodingKey {
        case id, slug, bio, rating, specialties
        case businessName = "business_name"
        case professionalTitle = "professional_title"
        case profilePictureUrl = "profile_picture_url"
        case totalBookings = "total_bookings"
        case distanceKm = "distance_km"
    }
}

class BookingService {
    let baseURL = "https://votre-app.vercel.app"

    func getAvailableContractors(
        serviceId: Int,
        date: String,
        time: String,
        addressId: Int? = nil
    ) async throws -> ContractorResponse {
        var components = URLComponents(string: "\(baseURL)/api/contractors/available")!
        components.queryItems = [
            URLQueryItem(name: "service_id", value: "\(serviceId)"),
            URLQueryItem(name: "date", value: date),
            URLQueryItem(name: "time", value: time)
        ]
        if let addressId = addressId {
            components.queryItems?.append(
                URLQueryItem(name: "address_id", value: "\(addressId)")
            )
        }

        let (data, response) = try await URLSession.shared.data(from: components.url!)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw BookingError.invalidResponse
        }

        let decoder = JSONDecoder()
        return try decoder.decode(ContractorResponse.self, from: data)
    }

    func assignContractor(
        serviceId: Int,
        date: String,
        time: String,
        addressId: Int? = nil
    ) async throws -> AssignmentResponse {
        let url = URL(string: "\(baseURL)/api/contractors/assign")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "service_id": serviceId,
            "date": date,
            "time": time,
            "address_id": addressId as Any
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw BookingError.invalidResponse
        }

        let decoder = JSONDecoder()
        return try decoder.decode(AssignmentResponse.self, from: data)
    }
}

// Utilisation dans SwiftUI
struct ContractorSelectionView: View {
    @State private var contractors: [Contractor] = []
    @State private var isLoading = false

    let bookingService = BookingService()

    var body: some View {
        List(contractors) { contractor in
            ContractorRow(contractor: contractor)
        }
        .task {
            isLoading = true
            do {
                let response = try await bookingService.getAvailableContractors(
                    serviceId: 1,
                    date: "2025-11-13",
                    time: "13:30"
                )
                contractors = response.contractors
            } catch {
                print("Error: \(error)")
            }
            isLoading = false
        }
    }
}
```

#### Option B : Appel Direct à la Fonction PostgreSQL (Production)

```swift
// Appel direct via Supabase RPC
func getAvailableContractorsDirectly(
    serviceId: Int,
    date: String,
    time: String
) async throws -> [Contractor] {
    let response = try await supabase
        .rpc("get_available_contractors", params: [
            "p_service_id": serviceId,
            "p_date": date,
            "p_time": time,
            "p_address_id": NSNull() // NULL pour optionnel
        ])
        .execute()

    let decoder = JSONDecoder()
    decoder.keyDecodingStrategy = .convertFromSnakeCase
    return try decoder.decode([Contractor].self, from: response.data)
}
```

### Authentification

```swift
// Login
try await supabase.auth.signIn(
    email: "user@example.com",
    password: "password123"
)

// Le token est automatiquement inclus dans les requêtes
let session = try await supabase.auth.session
print("Token: \(session.accessToken)")

// Toutes les requêtes Supabase incluent le token automatiquement
```

---

## 🤖 Intégration Android (Kotlin)

### Installation

```kotlin
// build.gradle.kts
dependencies {
    implementation("io.github.jan-tennert.supabase:postgrest-kt:2.0.0")
    implementation("io.github.jan-tennert.supabase:auth-kt:2.0.0")
    implementation("io.ktor:ktor-client-android:2.3.0")
}
```

### Configuration

```kotlin
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.auth.Auth

val supabase = createSupabaseClient(
    supabaseUrl = "https://xpntvajwrjuvsqsmizzb.supabase.co",
    supabaseKey = "YOUR_ANON_KEY"
) {
    install(Postgrest)
    install(Auth)
}
```

### Utilisation

```kotlin
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import io.ktor.client.*
import io.ktor.client.request.*
import io.ktor.client.statement.*

@Serializable
data class Contractor(
    val id: String,
    val slug: String,
    val businessName: String,
    val bio: String? = null,
    val professionalTitle: String? = null,
    val profilePictureUrl: String? = null,
    val rating: Double? = null,
    val totalBookings: Int,
    val distanceKm: Double? = null,
    val specialties: List<String>
)

@Serializable
data class ContractorResponse(
    val contractors: List<Contractor>,
    val total: Int,
    val service: ServiceInfo?,
    val timeslot: Timeslot
)

class BookingRepository(private val client: HttpClient) {
    private val baseURL = "https://votre-app.vercel.app"

    suspend fun getAvailableContractors(
        serviceId: Int,
        date: String,
        time: String,
        addressId: Int? = null
    ): ContractorResponse {
        val url = buildString {
            append("$baseURL/api/contractors/available")
            append("?service_id=$serviceId")
            append("&date=$date")
            append("&time=$time")
            addressId?.let { append("&address_id=$it") }
        }

        val response: HttpResponse = client.get(url)
        return Json.decodeFromString(response.bodyAsText())
    }

    suspend fun assignContractor(
        serviceId: Int,
        date: String,
        time: String,
        addressId: Int? = null
    ): AssignmentResponse {
        val response: HttpResponse = client.post("$baseURL/api/contractors/assign") {
            setBody(mapOf(
                "service_id" to serviceId,
                "date" to date,
                "time" to time,
                "address_id" to addressId
            ))
        }
        return Json.decodeFromString(response.bodyAsText())
    }
}

// Utilisation dans Compose
@Composable
fun ContractorSelectionScreen(viewModel: BookingViewModel) {
    val contractors by viewModel.contractors.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadAvailableContractors(
            serviceId = 1,
            date = "2025-11-13",
            time = "13:30"
        )
    }

    when {
        isLoading -> CircularProgressIndicator()
        contractors.isEmpty() -> Text("Aucun prestataire disponible")
        else -> LazyColumn {
            items(contractors) { contractor ->
                ContractorCard(contractor)
            }
        }
    }
}
```

---

## ⚛️ Intégration React Native

### Installation

```bash
npm install @supabase/supabase-js
```

### Configuration

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xpntvajwrjuvsqsmizzb.supabase.co',
  'YOUR_ANON_KEY'
);
```

### Utilisation

```typescript
import { useEffect, useState } from 'react';

interface Contractor {
  id: string;
  slug: string;
  business_name: string;
  bio?: string;
  professional_title?: string;
  rating?: number;
  total_bookings: number;
  specialties: string[];
}

export function useAvailableContractors(
  serviceId: number,
  date: string,
  time: string
) {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchContractors() {
      try {
        // Option A : Via API Next.js
        const response = await fetch(
          `https://votre-app.vercel.app/api/contractors/available?` +
          `service_id=${serviceId}&date=${date}&time=${time}`
        );
        const data = await response.json();
        setContractors(data.contractors);

        // Option B : Direct via Supabase RPC
        // const { data, error } = await supabase.rpc('get_available_contractors', {
        //   p_service_id: serviceId,
        //   p_date: date,
        //   p_time: time
        // });
        // if (error) throw error;
        // setContractors(data);

      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchContractors();
  }, [serviceId, date, time]);

  return { contractors, loading, error };
}

// Utilisation dans un composant
function ContractorSelectionScreen() {
  const { contractors, loading } = useAvailableContractors(
    1,
    '2025-11-13',
    '13:30'
  );

  if (loading) return <ActivityIndicator />;

  return (
    <FlatList
      data={contractors}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ContractorCard contractor={item} />}
    />
  );
}
```

---

## 🔒 Gestion de l'Authentification

### Tous les endpoints nécessitent l'authentification Supabase

```typescript
// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

// Le token est automatiquement inclus dans les headers
// des requêtes Supabase suivantes

// Récupérer le token manuellement (si nécessaire pour API Next.js)
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Inclure dans les requêtes manuelles
fetch('https://votre-app.vercel.app/api/bookings/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ ... })
});
```

---

## 📊 Comparaison des Approches

| Critère | API Next.js | Supabase RPC Direct |
|---------|------------|---------------------|
| **Simplicité** | ✅ Plus simple (REST standard) | ⚠️ Requiert SDK Supabase |
| **Performance** | ⚠️ 2 requêtes (Next.js → Supabase) | ✅ 1 requête directe |
| **Transformation de données** | ✅ Fait côté serveur | ❌ À faire côté client |
| **Gestion d'erreurs** | ✅ Normalisée par Next.js | ⚠️ À gérer manuellement |
| **CORS** | ✅ Géré automatiquement | ✅ Géré par Supabase |
| **Recommandation** | ✅ MVP et itérations rapides | ✅ Production optimisée |

---

## ✅ Checklist d'Intégration Mobile

- [ ] Configurer les variables d'environnement (SUPABASE_URL, ANON_KEY)
- [ ] Implémenter l'authentification Supabase
- [ ] Tester l'endpoint `/api/contractors/available`
- [ ] Tester l'endpoint `/api/contractors/assign`
- [ ] Implémenter la création de réservation
- [ ] Gérer les erreurs et timeouts
- [ ] Implémenter le refresh token automatique
- [ ] Tester avec connexion réseau lente/absente
- [ ] Configurer HTTPS (requis pour iOS App Store)
- [ ] Implémenter Analytics et crash reporting

---

## 🚀 Prochaines Étapes

1. **Distance géographique** : Implémenter le calcul de distance dans la fonction PostgreSQL
2. **Système de notation** : Créer la table `reviews` et mettre à jour la fonction
3. **Photos de profil** : Intégrer Supabase Storage pour les images
4. **Push notifications** : Notifier les prestataires de nouvelles demandes
5. **GraphQL** : Considérer Apollo pour des requêtes plus flexibles (optionnel)

---

## 📞 Support

Pour toute question sur l'intégration mobile, consultez :
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Supabase Swift SDK](https://github.com/supabase/supabase-swift)
- [Supabase Kotlin SDK](https://github.com/supabase-community/supabase-kt)
