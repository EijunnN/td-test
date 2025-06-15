---

### **Documento de Requisitos de Producto (PRD): Tower Defense Cooperativo**

**Versión:** 1.0
**Fecha:** 25 de Octubre de 2023
**Autor:** [Tu Nombre/Equipo]

---

### **1. Visión del Producto**

Crear un juego de Tower Defense cooperativo, en tiempo real y *mobile-first*, que sea accesible para jugadores casuales pero con suficiente profundidad estratégica para mantenerlos enganchados. El juego se centrará en la colaboración entre jugadores para superar oleadas de monstruos en mapas con múltiples caminos, utilizando un arsenal de torres personalizables. La arquitectura, basada en Bun y WebSockets y con datos gestionados por archivos JSON, garantizará una experiencia fluida y permitirá una fácil expansión de contenido futuro.

### **2. Audiencia Objetivo**

*   **Jugadores Casuales y Mid-core en dispositivos móviles:** Personas que disfrutan de juegos de estrategia y puzles, y buscan partidas rápidas (15-20 minutos) que puedan jugar solos o con amigos.
*   **Grupos de Amigos:** Buscan una experiencia cooperativa ligera que no requiera una gran inversión de tiempo para ser divertida.

### **3. Glosario de Términos (Para Eliminar Ambigüedad)**

*   **Sesión de Juego:** Una partida única en un mapa específico, desde la Oleada 1 hasta la victoria o la derrota.
*   **Jugador:** Un usuario conectado a una Sesión de Juego.
*   **Anfitrión (Host):** El jugador que crea la Sesión de Juego.
*   **Mapa:** El campo de batalla. Contiene caminos, portales y zonas de construcción.
*   **Camino:** Una ruta predefinida que los monstruos siguen desde un portal hasta la base. Un mapa puede tener múltiples caminos.
*   **Portal:** El punto de origen de donde aparecen los monstruos en un camino específico.
*   **Oleada (Wave):** Un grupo de monstruos programados para aparecer en un portal durante un período de tiempo.
*   **Oro:** El recurso principal del juego. **Es individual para cada jugador**. Se usa para comprar y mejorar torres.
*   **Vidas:** Un recurso **compartido por todos los jugadores** en la sesión. Se pierde una vida por cada monstruo que llega al final de un camino. Si llega a 0, la partida termina.
*   **Torre:** Unidad defensiva estática que los jugadores construyen. Sus atributos se definen en `towers.json`.
*   **Monstruo:** Unidad enemiga controlada por el servidor. Sus atributos se definen en `monsters.json`.
*   **Proyectil:** El objeto disparado por una torre. Puede tener diferentes comportamientos (ej. seguir al objetivo).

---

### **4. Historias de Usuario Detalladas**

#### **Épica 1: Gestión de la Partida**

*   **HU-1.1: Crear una partida**
    *   **Como** anfitrión,
    *   **quiero** crear una nueva sala de juego
    *   **para que** otros jugadores puedan unirse.
    *   **Criterios de Aceptación (AC):**
        *   Se genera una Sesión de Juego en el servidor.
        *   El anfitrión es transportado a una pantalla de "lobby" o directamente al mapa.
        *   Se genera un código de sala único (ej. "AB12") para compartir.

*   **HU-1.2: Unirse a una partida**
    *   **Como** jugador,
    *   **quiero** introducir un código de sala
    *   **para que** pueda unirme a la partida de un amigo.
    *   **AC:**
        *   La interfaz debe tener un campo de texto para el código.
        *   Si el código es válido y la partida no ha empezado, el jugador se une a la sesión.
        *   Si el código es inválido o la sala está llena, se muestra un mensaje de error claro.

*   **HU-1.3: Empezar la partida**
    *   **Como** anfitrión,
    *   **quiero** un botón de "Empezar Partida"
    *   **para que** se inicie la primera oleada de monstruos para todos los jugadores.
    *   **AC:**
        *   El botón solo es visible/clicable para el anfitrión.
        *   Al hacer clic, el servidor inicia el contador para la Oleada 1 y lo sincroniza para todos los clientes.

*   **HU-1.4: Condición de Derrota**
    *   **Como** jugador,
    *   **quiero** que la partida termine cuando nuestras vidas lleguen a cero
    *   **para que** haya un claro objetivo de fracaso.
    *   **AC:**
        *   Cuando el contador de Vidas compartidas llega a 0, el juego se detiene.
        *   Se muestra una pantalla de "Derrota" a todos los jugadores con estadísticas de la partida (oleadas superadas, monstruos eliminados).

*   **HU-1.5: Condición de Victoria**
    *   **Como** jugador,
    *   **quiero** ganar la partida al superar la última oleada definida para el mapa
    *   **para que** haya un claro objetivo de éxito.
    *   **AC:**
        *   Tras eliminar al último monstruo de la última oleada, el juego se detiene.
        *   Se muestra una pantalla de "Victoria" a todos los jugadores con sus estadísticas.

#### **Épica 2: Jugabilidad Principal (El Bucle de Juego)**

*   **HU-2.1: Construir una Torre**
    *   **Como** jugador,
    *   **quiero** seleccionar una torre de la tienda y colocarla en una zona válida del mapa
    *   **para que** pueda defender un camino.
    *   **AC:**
        *   El jugador debe tener suficiente Oro personal.
        *   La ubicación debe ser una zona de construcción permitida (no sobre un camino o sobre otra torre).
        *   Al construir, mi Oro se descuenta.
        *   La torre aparece visualmente en el mapa para todos los jugadores en tiempo real.
        *   El servidor valida la transacción y la posición antes de confirmarla.

*   **HU-2.2: Ganar Oro**
    *   **Como** jugador,
    *   **quiero** recibir oro cuando una de mis torres elimina a un monstruo
    *   **para que** pueda comprar más torres y mejoras.
    *   **AC:**
        *   El valor en oro de cada monstruo se define en `monsters.json`.
        *   El jugador que da el golpe de gracia al monstruo recibe la cantidad de oro completa.
        *   La actualización del oro es visible en mi UI de inmediato.

*   **HU-2.3: Aparición de Oleadas**
    *   **Como** jugador,
    *   **quiero** ver a los monstruos aparecer en sus portales y seguir sus caminos designados
    *   **para que** pueda planificar mis defensas.
    *   **AC:**
        *   Hay un temporizador visible entre oleadas.
        *   Los monstruos de una oleada aparecen en el portal y siguen los puntos de ruta (waypoints) de su camino específico.
        *   Los monstruos no se desvían del camino.

*   **HU-2.4: Ataque de las Torres**
    *   **Como** jugador,
    *   **quiero** que mis torres ataquen automáticamente a los monstruos que entran en su rango
    *   **para que** pueda defender la base.
    *   **AC:**
        *   La torre debe poder atacar al tipo de monstruo (ej. una torre terrestre no puede atacar a uno aéreo si no se especifica).
        *   La torre dispara proyectiles al ritmo de su `attackSpeed`.
        *   Los proyectiles viajan hacia la posición actual del objetivo y le infligen daño al impactar.
        *   El cálculo del daño y la reducción de HP del monstruo se realiza en el servidor.

*   **HU-2.5: Mejorar una Torre**
    *   **Como** jugador,
    *   **quiero** hacer clic en una torre que construí y pagar para mejorarla
    *   **para que** sea más poderosa.
    *   **AC:**
        *   Solo puedo mejorar mis propias torres.
        *   Al seleccionar mi torre, veo el coste y las estadísticas de la siguiente mejora.
        *   Debo tener suficiente Oro personal para la mejora.
        *   El modelo visual de la torre puede cambiar para reflejar la mejora.

*   **HU-2.6: Vender una Torre**
    *   **Como** jugador,
    *   **quiero** vender una de mis torres
    *   **para que** pueda recuperar parte del oro y reajustar mi estrategia.
    *   **AC:**
        *   Solo puedo vender mis propias torres.
        *   Recibo un porcentaje fijo (ej. 75%) del oro total invertido en esa torre.
        *   La torre desaparece del mapa.

#### **Épica 3: Interfaz y Comunicación**

*   **HU-3.1: Ver Recursos**
    *   **Como** jugador,
    *   **quiero** ver siempre en pantalla mi cantidad de Oro y la cantidad de Vidas compartidas
    *   **para que** pueda tomar decisiones informadas.
    *   **AC:**
        *   La UI muestra claramente "Tu Oro: [cantidad]" y "Vidas del Equipo: [cantidad]".
        *   Estos valores se actualizan en tiempo real.

*   **HU-3.2: Tienda de Torres**
    *   **Como** jugador,
    *   **quiero** abrir una tienda que me muestre las torres disponibles para comprar
    *   **para que** pueda elegir mi defensa.
    *   **AC:**
        *   La tienda es accesible a través de un botón en la UI (en móvil, puede ser un `Sheet` de Shadcn).
        *   Cada torre en la tienda muestra su icono, nombre, coste y una breve descripción de su función (ej. "Anti-aéreo", "Daño en área").

*   **HU-3.3: Chat en el Juego**
    *   **Como** jugador,
    *   **quiero** un panel de chat para enviar y recibir mensajes de mis compañeros
    *   **para que** podamos coordinar nuestra estrategia.
    *   **AC:**
        *   El chat es visible para todos los jugadores en la sesión.
        *   En móvil, el chat puede estar minimizado o en un `Sheet` para no obstruir la vista.
        *   Los mensajes muestran el nombre del jugador que los envió.

---

### **5. Requisitos No Funcionales**

*   **Rendimiento:**
    *   La comunicación cliente-servidor vía WebSocket debe tener una latencia inferior a 200ms para acciones clave (construir, mejorar).
    *   El juego debe funcionar fluidamente (>30 FPS) en dispositivos móviles de gama media con hasta 100 monstruos en pantalla.
*   **Seguridad:**
    *   **Toda la lógica de juego es autoritativa del servidor.** El cliente solo envía intentos de acción (ej. "quiero construir aquí"). El servidor valida el coste, la posición y el estado del juego antes de aplicar cualquier cambio. Esto previene el cheating.
*   **Usabilidad:**
    *   La interfaz debe ser completamente responsive y seguir un enfoque *mobile-first*.
    *   Los controles deben ser intuitivos (tocar para seleccionar, tocar para construir).
    *   Debe haber feedback visual claro para todas las acciones (construir, error, recibir oro).
*   **Escalabilidad:**
    *   El servidor de Bun debe poder gestionar al menos 20 sesiones de juego simultáneas (40-60 jugadores en total) en su versión inicial.
*   **Extensibilidad (Arquitectura):**
    *   El juego debe cargar los datos de monstruos, torres y mapas desde archivos JSON al iniciarse. Modificar estos archivos es suficiente para balancear o añadir nuevo contenido básico sin necesidad de redesplegar el código del servidor.

---

### **6. Estructura de Datos (JSON Schemas)**

*   **`monsters.json`**: Ver [ejemplo anterior](https://www.google.com/search?q=ejemplo+json+monstruos+tower+defense)
*   **`towers.json`**: Ver [ejemplo anterior](https://www.google.com/search?q=ejemplo+json+torres+tower+defense)
*   **`map_data.json`**:
    ```json
    {
      "id": "canyon_of_echoes",
      "name": "Cañón de los Ecos",
      "maxPlayers": 2,
      "initialLives": 20,
      "initialGold": 250,
      "waves": [ /* Array de definiciones de oleadas */ ],
      "buildableArea": [ { "x": 0, "y": 0, "width": 800, "height": 300 } ],
      "paths": [
        {
          "id": "path_north",
          "portal": { "x": 50, "y": 0 },
          "waypoints": [ { "x": 50, "y": 100 }, { "x": 200, "y": 100 }, { "x": 200, "y": 500 } ]
        },
        {
          "id": "path_west",
          "portal": { "x": 0, "y": 250 },
          "waypoints": [ { "x": 150, "y": 250 }, { "x": 150, "y": 400 }, { "x": 200, "y": 500 } ]
        }
      ]
    }
    ```

---

### **7. Fuera de Alcance (Para la v1.0)**

*   Modos de juego alternativos (Infinito, PvP).
*   Sistema de progresión persistente entre partidas (árboles de talentos, experiencia).
*   Habilidades activas del jugador.
*   Personalización cosmética.
*   Tablas de clasificación (leaderboards).
*   Múltiples tipos de proyectiles con lógicas complejas (ej. veneno, quemadura). La v1.0 usará proyectiles de impacto directo y de seguimiento.