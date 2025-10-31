
// (las funciones simulateStep, startPDASimulation, analyzeGLC, etc.)
// 1. Definición formal del pda (ejercicio 3)
let PDA = {
    Q: [],
    Sigma: [],
    Gamma: [],
    q0: '',
    Z: '',
    F: [],
    transitions: []
};

// Fallback embebido para entorno file:// (sin servidor)
const builtInDescription = {
    Q: ["q0", "q1", "q2", "q3", "q4"],
    Sigma: ["a", "b", "x", "y", "c"],
    Gamma: ["Z", "#", "A", "B"],
    q0: "q0",
    Z: "Z",
    F: ["q4"]
};
const builtInTransitions = [
    { current_state: 'q0', input_symbol: 'a', stack_top: 'Z', next_state: 'q0', stack_push: ['A', 'Z'], desc: 'Lee a, Push A' },
    { current_state: 'q0', input_symbol: 'a', stack_top: 'A', next_state: 'q0', stack_push: ['A', 'A'], desc: 'Lee a, Push A' },
        // Corrección
    { current_state: 'q0', input_symbol: 'b', stack_top: 'A', next_state: 'q1', stack_push: ['B', '#'], desc: 'Lee b, Pop A, Push B y marcador #' }   ,
   // { current_state: 'q0', input_symbol: 'b', stack_top: 'A', next_state: 'q1', stack_push: ['B', '#', 'A'], desc: 'Lee b, Push B, marcador #' }, //
    { current_state: 'q1', input_symbol: 'b', stack_top: 'B', next_state: 'q1', stack_push: ['B', 'B'], desc: 'Lee b, Push B' },
    { current_state: 'q1', input_symbol: 'x', stack_top: 'B', next_state: 'q2', stack_push: ['B'], desc: 'Lee x, No modifica pila' },
    { current_state: 'q2', input_symbol: 'y', stack_top: 'B', next_state: 'q2', stack_push: ['B'], desc: 'Lee y, No modifica pila' },
    { current_state: 'q2', input_symbol: 'y', stack_top: '#', next_state: 'q2', stack_push: ['#'], desc: 'Lee y, No modifica pila' },
    { current_state: 'q2', input_symbol: 'c', stack_top: 'B', next_state: 'q3', stack_push: [], desc: 'Lee c, Pop B' },
    { current_state: 'q3', input_symbol: 'c', stack_top: 'B', next_state: 'q3', stack_push: [], desc: 'Lee c, Pop B' },
    { current_state: 'q3', input_symbol: 'a', stack_top: '#', next_state: 'q3', stack_push: [], desc: 'Lee a, Pop #' },
    { current_state: 'q3', input_symbol: 'a', stack_top: 'A', next_state: 'q3', stack_push: [], desc: 'Lee a, Pop A' },
    //{ current_state: 'q3', input_symbol: 'λ', stack_top: 'A', next_state: 'q3', stack_push: [], desc: 'Lambda, Pop A' }, //
    { current_state: 'q3', input_symbol: 'λ', stack_top: 'Z', next_state: 'q4', stack_push: [], desc: 'Fin de entrada, Pop Z (Aceptar)' }
];

async function loadPDAData() {
    // Si se abre con file:// usar fallback embebido
    if (location.protocol === 'file:') {
        PDA = { ...builtInDescription, transitions: builtInTransitions };
        return;
    }
    try {
        const [descRes, transRes] = await Promise.all([
            fetch('data/description.json', { cache: 'no-store' }),
            fetch('data/transitions.json', { cache: 'no-store' })
        ]);
        if (!descRes.ok || !transRes.ok) {
            throw new Error('No se pudo cargar la definición del PDA');
        }
        const description = await descRes.json();
        const transitions = await transRes.json();
        PDA = { ...description, transitions };
    } catch (e) {
        // Fallback si falla el fetch por CORS/servidor
        PDA = { ...builtInDescription, transitions: builtInTransitions };
    }
}

// 2. Elementos Dom y estados gloables
const inputStringElem = document.getElementById('inputString');
const startButton = document.getElementById('startButton');
const stepButton = document.getElementById('stepButton');
const resetButton = document.getElementById('resetButton');
const resultElem = document.getElementById('result');
const currentStateElem = document.getElementById('currentState');
const remainingInputElem = document.getElementById('remainingInput');
const currentStackElem = document.getElementById('currentStack');
const diLogElem = document.getElementById('diLog');
const pdaGraphElem = document.getElementById('pdaGraph');

let currentInput = '';
let currentStack = [];
let currentState = PDA.q0;
let inputIndex = 0;
let simulationStep = 0;
let initialACount = 0; // Contador de 'a's iniciales
let network = null; // Para el grafo de vis.js
let graphNodes = new vis.DataSet();
let graphEdges = new vis.DataSet();



// 3. Descipcion formal
function generateFormalDescription() {
    let desc = `P = (Q, Σ, Γ, δ, q0, q4, Z)\n\n`;
    desc += `Q = {${PDA.Q.join(', ')}}\n`;
    desc += `Σ = {${PDA.Sigma.join(', ')}}\n`;
    desc += `Γ = {${PDA.Gamma.join(', ')}}\n`;
    desc += `q0 = ${PDA.q0}\n`;
    desc += `Z = ${PDA.Z}\n`;
    desc += `F = {${PDA.F.join(', ')}}\n\n`;
    desc += `δ (Función de Transición):\n`;

    PDA.transitions.forEach(t => {
        let input = t.input_symbol === 'λ' ? 'λ' : t.input_symbol;
        let stackPop = t.stack_top;
        let stackPush = t.stack_push.length === 0 ? 'λ' : t.stack_push.join('');
        desc += `  δ(${t.current_state}, ${input}, ${stackPop}) → (${t.next_state}, ${stackPush})  // ${t.desc}\n`;
    });
    document.getElementById('formalDescContent').textContent = desc;
}


// 4. Tabla de transición
function generateTransitionTable() {
    const tbody = document.querySelector('#transitionTableContent tbody');
    tbody.innerHTML = ''; // Limpiar tabla anterior
    PDA.transitions.forEach(t => {
        const row = tbody.insertRow();
        row.insertCell().textContent = t.current_state;
        row.insertCell().textContent = t.input_symbol === 'λ' ? 'λ (Vacío)' : t.input_symbol;
        row.insertCell().textContent = t.stack_top;
        row.insertCell().textContent = t.next_state;
        row.insertCell().textContent = t.stack_push.length === 0 ? 'λ (Pop)' : t.stack_push.join('') + ' (Push)';
    });
}



// 5. Diubujo grafo
    function drawGraph() {
        graphNodes = new vis.DataSet();
        graphEdges = new vis.DataSet();

    // Añadir un nodo invisible que representa la flecha inicial
    graphNodes.add({ 
        id: 'start-arrow', 
        label: '', 
        shape: 'text', // invisible
        size: 0
    });

    graphEdges.add({
        from: 'start-arrow',    
        to: PDA.q0,
        arrows: 'to',
        color: { color: '#000000', inherit: 'false' }, // Color negro
        id: 'edge-start',
        smooth: { enabled: false } // Línea recta
    });
    
    

    const loopCountByNode = {};
    // Añadir nodos
    PDA.Q.forEach(q => {
        let node = { id: q, label: q, shape: 'circle' };
        if (q === PDA.q0) {
            node.color = { background: '#FFFACD', border: '#FFA500' }; // Estado inicial
            node.font = { color: '#FFA500', size:18, strokeWidth:1};
        }
        if (PDA.F.includes(q)) {
            // Estado de aceptación: borde más grueso y color distintivo
            node.color = { background: '#D4EDDA', border: '#28A745' };
            node.font = { color: '#28A745', size:18, strokeWidth:1};
            node.borderWidth = 5;
            node.borderWidthSelected = 6;
        }
        graphNodes.add(node);
    });

    // Añadir aristas (transiciones)
    PDA.transitions.forEach((t, index) => {
        const from = t.current_state;
        const to = t.next_state;
        const isLoop = from === to;
      
        // etiqueta normal
        let label = `${t.input_symbol}, ${t.stack_top} ; ${t.stack_push.length === 0 ? 'λ' : t.stack_push.join('')}`;
      
        // default vadjust para aristas no-loop
        let vadjust = 0;
        let roundness = 0.4;
        let smoothType = 'cubicBezier';
      
        if (isLoop) {
          // inicializar contador si hace falta
          if (!loopCountByNode[from]) loopCountByNode[from] = 0;
      
          const i = loopCountByNode[from]; // 0,1,2,...
          const base = -10;    // desplazamiento del primer label (ajusta a tu gusto)
          const step = 16;     // separación entre filas de etiquetas
          vadjust = base - i * step;
      
          // aumentar la curvatura según el index para separar las aristas
          // valores más altos => arco más grande
          roundness = 0.35 + i * 0.12;
          // para self-loops vis.js acepta tipo 'curvedCW' o 'curvedCCW' para loops
          smoothType = 'curvedCW';
      
          // incrementar contador para el siguiente loop del mismo nodo
          loopCountByNode[from] += 1;
        }
      
        graphEdges.add({
          from: from,
          to: to,
          label: label,
          font: {
            align: 'top',
            vadjust: vadjust,
            size: 14,
            color: '#222'
          },
          arrows: 'to',
          id: `edge-${index}`,
          smooth: {
            enabled: true,
            type: smoothType,
            roundness: roundness
          }
        });
      });
    

    const data = {
        nodes: graphNodes,
        edges: graphEdges
    };
    const options = {   
        layout: {
            hierarchical: {
                direction: 'LR', // De izquierda a derecha
                sortMethod: 'directed',
                levelSeparation: 150
            }
        },
        edges: {
            smooth: {
                type: 'cubicBezier',
                forceDirection: 'horizontal',
                roundness: 0.4
            },
            color: '#777',
            width: 1.5,
            arrows: { to: { enabled: true, scaleFactor: 0.8 } }
        },
        nodes: {
            color: {
                border: '#4CAF50',
                background: '#e0ffe0',
                highlight: {
                    border: '#007bff',
                    background: '#e6f2ff'
                }
            },
            font: { color: '#333', size:16 }
        },
        physics: false // Deshabilita la física para un diseño fijo
    };

    network = new vis.Network(pdaGraphElem, data, options);
}

// Resaltar el estado actual en el grafo
function highlightCurrentState() {
    graphNodes.forEach(node => {
        graphNodes.update({ id: node.id, color: null, borderWidth: null, font: null }); // Resetear todos
        let nodeUpdate = { id: node.id };
        if (node.id === PDA.q0) {
            nodeUpdate.color = { background: '#FFFACD', border: '#FFA500' }; 
            nodeUpdate.font = { color: '#FFA500', size:18, strokeWidth:1};
        }
        if (PDA.F.includes(node.id)) {
            nodeUpdate.color = { background: '#D4EDDA', border: '#28A745' };
            nodeUpdate.font = { color: '#28A745', size:18, strokeWidth:1};
            nodeUpdate.borderWidth = 5; // conservar borde grueso en estados de aceptación
        }
        graphNodes.update(nodeUpdate);
    });

    graphEdges.forEach(edge => {
        graphEdges.update({ id: edge.id, color: '#777', width: 1.5, arrows: { to: { enabled: true, scaleFactor: 0.8 } } });
    });


    const isFinal = PDA.F.includes(currentState);
    graphNodes.update({ id: currentState, color: { border: '#007bff', background: '#e6f2ff' }, borderWidth: isFinal ? 6 : 3 });
}



// 6. Simulación paso a paso
function resetSimulation() {
    currentInput = '';
    currentStack = [PDA.Z]; // Pila inicial con marcador Z
    currentState = PDA.q0;
    inputIndex = 0;
    simulationStep = 0;
    initialACount = 0; // Resetear contador de 'a's iniciales
    diLogElem.innerHTML = '';
    resultElem.textContent = '';
    resultElem.className = 'message';

    startButton.disabled = false;
    stepButton.disabled = true;
    resetButton.disabled = true;
    inputStringElem.disabled = false;

    updateUI();
    highlightCurrentState();
}

function updateUI(transitionDesc = '') {
    currentStateElem.textContent = currentState;
    remainingInputElem.textContent = currentInput.substring(inputIndex);
    currentStackElem.textContent = currentStack.slice().reverse().join(''); // Pila: Z, A, B -> B, A, Z

    // Añadir a la Descripción Instantánea
    const row = diLogElem.insertRow();
    row.insertCell().textContent = simulationStep;
    row.insertCell().textContent = currentState;
    row.insertCell().textContent = currentInput.substring(inputIndex);
    row.insertCell().textContent = currentStack.slice().reverse().join('');
    row.insertCell().textContent = transitionDesc;
    diLogElem.scrollTop = diLogElem.scrollHeight; // Scroll automático

    highlightCurrentState(); // Actualiza el resaltado del grafo
}

function findNextTransition(state, inputChar, stackTop) {
    console.log(`Buscando transición: estado=${state}, input='${inputChar}', stackTop='${stackTop}'`);
    
    // Buscar transiciones para el símbolo de entrada actual
    let possibleTransitions = PDA.transitions.filter(t =>
        t.current_state === state &&
        (t.input_symbol === inputChar || t.input_symbol === 'λ') && // Permite transiciones λ
        t.stack_top === stackTop
    );

    console.log(`Transiciones posibles:`, possibleTransitions);

    // Priorizar transiciones que consumen input sobre transiciones lambda si hay conflicto
    let consumingTransitions = possibleTransitions.filter(t => t.input_symbol !== 'λ');
    if (consumingTransitions.length > 0) {
        console.log(`Usando transición que consume input:`, consumingTransitions[0]);
        return consumingTransitions[0]; // Retorna la primera transición que consume input
    } else if (possibleTransitions.length > 0) {
        console.log(`Usando transición lambda:`, possibleTransitions[0]);
        return possibleTransitions[0]; // Retorna la primera transición lambda si no hay de consumo
    }
    
    console.log(`No se encontró transición`);
    return null; // No se encontró transición
}

function simulateStep() {
    simulationStep++;
    const inputChar = currentInput[inputIndex] || 'λ'; // 'λ' si la entrada está vacía
    const stackTop = currentStack.length > 0 ? currentStack[currentStack.length - 1] : '';

    console.log(`Paso ${simulationStep}: Estado=${currentState}, Input='${inputChar}', StackTop='${stackTop}', Pila=[${currentStack.join(',')}]`);

    let transition = findNextTransition(currentState, inputChar, stackTop);
    
    // Si no hay transición con el símbolo actual, intentar con λ si no es ya λ
    if (!transition && inputChar !== 'λ') {
        console.log('No hay transición con símbolo actual, intentando con λ...');
        transition = findNextTransition(currentState, 'λ', stackTop);
    }

    if (transition) {
        console.log(`Transición encontrada: ${transition.desc}`);
        // Resaltar la transición aplicada
        const edgeId = PDA.transitions.findIndex(t => t === transition);
        graphEdges.update({ id: `edge-${edgeId}`, color: 'red', width: 3 });

        currentState = transition.next_state;
        
        // Consumir input si no es lambda
        if (transition.input_symbol !== 'λ') {
            // Contar 'a's iniciales cuando estamos en q0
            if (currentState === PDA.q0 && transition.input_symbol === 'a') {
                initialACount++;
            }
            inputIndex++;
        }

        // Modificar la pila
        currentStack.pop(); // Siempre se hace pop del stack_top
        if (transition.stack_push.length > 0) {
            // Push en orden inverso si se empujan varios elementos (ej. [B, #, A] -> A luego # luego B)
            for (let i = transition.stack_push.length - 1; i >= 0; i--) {
                currentStack.push(transition.stack_push[i]);
            }
        }
        
        updateUI(transition.desc);

        // Verificar aceptación después de cada paso
        if (PDA.F.includes(currentState)) {
            // Verificar que se hayan leído al menos 2 'a's iniciales
            if (initialACount >= 2) {
                resultElem.textContent = 'Cadena ACEPTADA!';
                resultElem.className = 'message success';
            } else {
                resultElem.textContent = 'Cadena RECHAZADA (n < 2)!';
                resultElem.className = 'message error';
            }
            stepButton.disabled = true; // Simulación terminada
        }

    } else {
        console.log(`No se encontró transición. InputIndex=${inputIndex}, InputLength=${currentInput.length}, Estado=${currentState}, EsFinal=${PDA.F.includes(currentState)}`);
        // No hay transición posible - verificar si se puede aceptar
        if (inputIndex === currentInput.length && PDA.F.includes(currentState)) {
            // Verificar que se hayan leído al menos 2 'a's iniciales
            if (initialACount >= 2) {
                resultElem.textContent = 'Cadena ACEPTADA!';
                resultElem.className = 'message success';
            } else {
                resultElem.textContent = 'Cadena RECHAZADA (n < 2)!';
                resultElem.className = 'message error';
            }
        } else {
            resultElem.textContent = 'Cadena RECHAZADA (Atascado o no cumple condiciones)!';
            resultElem.className = 'message error';
        }
        stepButton.disabled = true;
    }
}



// 7. LISTENERS DE EVENTOS E INICIALIZACIÓN
startButton.addEventListener('click', () => {
    currentInput = inputStringElem.value.trim();
    if (!currentInput) {
        resultElem.textContent = 'Por favor, ingresa una cadena.';
        resultElem.className = 'message error';
        return;
    }
    
    resetSimulation(); // Limpiar el estado anterior
    currentInput = inputStringElem.value.trim(); // Volver a tomar el input

    startButton.disabled = true;
    stepButton.disabled = false;
    resetButton.disabled = false;
    inputStringElem.disabled = true;

    // Primer paso de la DI
    updateUI('Inicio de Simulación');
});

stepButton.addEventListener('click', simulateStep);
resetButton.addEventListener('click', resetSimulation);


// 1. Definición formal de la gramática libre de contexto (GLC)
const GLC = {
    start_symbol: 'S',
    rules: {
        'S': ['a S a', 'a A a'], // Contador n (S -> a A a es la base, fuerza n>=2)
        'A': ['b B c'],         // Transición a b^m c^m
        'B': ['b B c', 'C'],     // Contador m (B -> C es la base, fuerza m>=1)
        'C': ['x D'],           // Parte central (lee x)
        'D': ['y D', 'λ']       // Parte central y*
    }
};


// 2. Lógica de prueba de derivación izquierda

function analyzeGLC(inputChain, strategy = 'left') {
    // 1. Verificación Estructural y de Restricciones
    // Regex: (a^n)(b^m)(x)(y*)(c^m)(a^n)
    const regex = /^(a+)(b+)(x)(y*)(c+)(a+)$/; 
    const match = inputChain.match(regex);

    // Primera verificación: estructura básica
    if (!match || match[2].length !== match[5].length || match[1].length !== match[6].length) {
        return { accepted: false, reason: "La cadena no cumple la estructura a^n b^m x y* c^m a^n o los contadores no coinciden." };
    }

    const n = match[1].length; 
    const m = match[2].length; 
    const y_length = match[4].length; 

    // Verificación de restricciones numéricas
    if (n < 2) {
         return { accepted: false, reason: `Restricción fallida: n=${n} (debe ser >= 2).` };
    }
    if (m < 1) {
         return { accepted: false, reason: `Restricción fallida: m=${m} (debe ser >= 1).` };
    }
    
    //  Construcción de la derivación (izquierda o derecha) 
    let steps = [];
    let current = 'S';
    
    // Funciones auxiliares para registrar el paso y aplicar la regla
    // a la variable más izquierda o más derecha según 'strategy'.
    const addStepLeft = (variable, production) => {
        let prev = current;
        // Solo reemplaza la primera ocurrencia de la variable (lo que fuerza Derivación Izquierda)
        current = current.replace(variable, production);
        steps.push({ prev, next: current, rule: `${variable} -> ${production}` });
    };
    const addStepRight = (variable, production) => {
        let prev = current;
        const idx = current.lastIndexOf(variable);
        if (idx === -1) return; // seguridad: no debería ocurrir si la secuencia es correcta
        current = current.substring(0, idx) + production + current.substring(idx + variable.length);
        steps.push({ prev, next: current, rule: `${variable} -> ${production}` });
    };
    const addStep = (variable, production) => (strategy === 'right' ? addStepRight(variable, production) : addStepLeft(variable, production));

    // 1. Contador a^n Exterior (S -> a S a)
    // Se realiza (n - 2) veces la recursión S -> a S a. (Si n=2, el bucle se salta).
    for (let i = 0; i < n - 2; i++) {
        addStep('S', 'a S a');
    }
    
    // 2. Base del Contador a^n (S -> a A a)
    // Esto es el último paso que transforma S en A, completando el conteo de a^n.
    addStep('S', 'a A a'); 

    // 3. Transición a b^m c^m (A -> b B c)
    addStep('A', 'b B c');
    
    // 4. Contador b^m c^m (B -> b B c)
    // Se realiza (m - 1) veces la recursión B -> b B c. (Si m=1, el bucle se salta).
    for (let i = 0; i < m - 1; i++) {
        addStep('B', 'b B c');
    }
    
    // 5. Base del Contador b^m c^m (B -> C)
    // Transición a la parte central.
    addStep('B', 'C');

    // 6. Transición a la parte central (C -> x D)
    addStep('C', 'x D');

    // 7. Contador y* (D -> y D)
    // Se realiza y_length veces la recursión D -> y D.
    for (let i = 0; i < y_length; i++) {
        addStep('D', 'y D');
    }
    
    // 8. Final (D -> λ)
    addStep('D', 'λ');
    
    return { accepted: true, derivation: steps, strategy };
}




// 3. Manejador de eventos para la derivación

const deriveButton = document.getElementById('deriveButton');
const derivationResultElem = document.getElementById('derivationResult');
const generateIdsButton = document.getElementById('generateIdsButton');
const pdaIdsResultElem = document.getElementById('pdaIdsResult');

if (deriveButton) {
    deriveButton.addEventListener('click', () => {
        const inputChain = inputStringElem.value.trim();
        if (!inputChain) {
            derivationResultElem.innerHTML = '<div class="message warning">Por favor, ingresa una cadena.</div>';
            return;
        }

        const selected = document.querySelector('input[name="derivationStrategy"]:checked');
        const strategy = selected ? selected.value : 'left';
        const result = analyzeGLC(inputChain, strategy);
        
        if (result.accepted) {
            // Formatear la derivación
            const initialStep = `<li>$\\mathbf{S}$</li>`;
            
            const derivationList = result.derivation.map((step) => {
                const rule = `$${step.prev} \\implies ${step.next}$`; // Asegúrate de encerrar todo en $$
                return `<li>${rule}</li>`;
            }).join('');

            derivationResultElem.innerHTML = `
                <div class="message success">Cadena ACEPTADA. Derivación ${result.strategy === 'right' ? 'Derecha' : 'Izquierda'} Generada.</div>
                <h3>Prueba de Derivación ${result.strategy === 'right' ? 'Derecha' : 'Izquierda'}:</h3>
                <ol>${initialStep}${derivationList}</ol>
            `;

            // Renderizar LaTeX si MathJax está cargado
            if (window.MathJax) {
                MathJax.typesetPromise();
            }

        } else {
            derivationResultElem.innerHTML = `
                <div class="message error">Cadena RECHAZADA por la GLC</div>
                <p>Razón: ${result.reason}</p>
            `;
        }
    });
}


// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadPDAData();
        generateFormalDescription();
        generateTransitionTable();
        drawGraph();
        resetSimulation();
        // Listeners de ejemplos de cadenas
        const exampleButtons = document.querySelectorAll('.exampleChain');
        exampleButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const chain = btn.getAttribute('data-chain') || '';
                inputStringElem.value = chain;
                resultElem.textContent = '';
                derivationResultElem && (derivationResultElem.innerHTML = '');
                pdaIdsResultElem && (pdaIdsResultElem.innerHTML = '');
                startButton.disabled = false;
                stepButton.disabled = true;
                resetButton.disabled = true;
            });
        });
    } catch (e) {
        const resultElem = document.getElementById('result');
        if (resultElem) {
            resultElem.textContent = 'Error cargando PDA: ' + e.message;
            resultElem.className = 'message error';
        }
    }
});


// 4. Generador de ids del pda (local, no altera la UI)
function generatePDAIDs(inputChain) {
    let ids = [];
    let localInput = inputChain;
    let localIndex = 0;
    let localStack = [PDA.Z];
    let localState = PDA.q0;

    const pushSnapshot = (transitionDesc = '') => {
        const remaining = localInput.substring(localIndex);
        const stackString = localStack.slice().reverse().join('');
        // Mostrar estado final como 'qf' si está en F, de lo contrario el nombre real
        const shownState = PDA.F.includes(localState) ? 'qf' : localState;
        ids.push({
            state: shownState,
            remaining: remaining === '' ? 'λ' : remaining,
            stack: stackString === '' ? 'λ' : stackString,
            transition: transitionDesc
        });
    };

    // ID inicial
    pushSnapshot('Inicio');

    // Límite de seguridad
    let safety = 1000;
    while (safety-- > 0) {
        const inputChar = localInput[localIndex] || 'λ';
        const stackTop = localStack.length > 0 ? localStack[localStack.length - 1] : '';

        // Buscar transiciones aplicables, priorizando consumo sobre λ
        let possible = PDA.transitions.filter(t =>
            t.current_state === localState &&
            (t.input_symbol === inputChar || t.input_symbol === 'λ') &&
            t.stack_top === stackTop
        );
        let transition = possible.find(t => t.input_symbol !== 'λ') || possible[0] || null;

        if (!transition && inputChar !== 'λ') {
            possible = PDA.transitions.filter(t =>
                t.current_state === localState &&
                t.input_symbol === 'λ' &&
                t.stack_top === stackTop
            );
            transition = possible[0] || null;
        }

        if (!transition) break;

        // Aplicar transición
        localState = transition.next_state;
        if (transition.input_symbol !== 'λ') localIndex++;
        // Pila
        localStack.pop();
        if (transition.stack_push.length > 0) {
            for (let i = transition.stack_push.length - 1; i >= 0; i--) {
                localStack.push(transition.stack_push[i]);
            }
        }

        pushSnapshot(transition.desc || '');

        // Parar si aceptamos y no queda entrada
        if (PDA.F.includes(localState) && localIndex >= localInput.length) break;
    }

    return ids;
}

// Botón: generar IDs debajo de la tabla
if (generateIdsButton) {
    generateIdsButton.addEventListener('click', () => {
        const inputChain = inputStringElem.value.trim();
        if (!inputChain) {
            if (pdaIdsResultElem) {
                pdaIdsResultElem.innerHTML = '<div class="message warning">Por favor, ingresa una cadena arriba.</div>';
            }
            return;
        }

        const ids = generatePDAIDs(inputChain);
        const formatted = ids.map(id => `(${id.state}, ${id.remaining}, ${id.stack})`).join('<br>');
        if (pdaIdsResultElem) {
            pdaIdsResultElem.innerHTML = `
                <h3>IDs del PDA para la cadena:</h3>
                <div style="font-family: monospace; white-space: pre-wrap;">${formatted}</div>
            `;
        }
        // Render LaTeX si existiera, aunque aquí no hay
        if (window.MathJax) MathJax.typesetPromise();
    });
}

