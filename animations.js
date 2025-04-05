document.addEventListener('DOMContentLoaded', function() {
    // Identify which page we're on to initialize appropriate animations
    const onHomePage = document.getElementById('math-animation');
    const onLiteraturePage = document.getElementById('header-animation');
    
    if (onHomePage) {
        initComplexDynamicalSystem();
        initOracle();
    }
    
    if (onLiteraturePage) {
        initBookPageAnimation();
    }
});

// Creates a 3D visualization of a complex dynamical system inspired by the Lorenz attractor
function initComplexDynamicalSystem() {
    const container = document.getElementById('math-animation');
    
    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    
    // Camera position
    camera.position.z = 30;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);
    
    // Create the attractor system
    const particleCount = 5000;
    const particles = new THREE.BufferGeometry();
    
    // Initialize positions array
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    // Parameters for the Lorenz system
    const sigma = 10;
    const rho = 28;
    const beta = 8/3;
    
    // Initial point
    let x = 0.1;
    let y = 0;
    let z = 0;
    
    // Time step
    const dt = 0.01;
    
    // Generate the points of the attractor
    for (let i = 0; i < particleCount; i++) {
        // Lorenz equations
        const dx = sigma * (y - x) * dt;
        const dy = (x * (rho - z) - y) * dt;
        const dz = (x * y - beta * z) * dt;
        
        x += dx;
        y += dy;
        z += dz;
        
        // Scale down the points to fit in our view
        const scale = 0.5;
        positions[i * 3] = x * scale;
        positions[i * 3 + 1] = y * scale;
        positions[i * 3 + 2] = z * scale;
        
        // Color based on position
        const t = i / particleCount;
        colors[i * 3] = 0.4 + 0.6 * Math.sin(t * Math.PI * 2);            // R
        colors[i * 3 + 1] = 0.4 + 0.6 * Math.sin(t * Math.PI * 2 + 2);    // G
        colors[i * 3 + 2] = 0.8 + 0.2 * Math.sin(t * Math.PI * 2 + 4);    // B
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Material for the particles
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        transparent: true,
        opacity: 0.7
    });
    
    // Create the particle system
    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);
    
    // Add a smooth curve through the attractor
    const curve = createCurveThroughAttractor(positions, particleCount);
    scene.add(curve);
    
    // Add rotation control with mouse
    addMouseControls(container, particleSystem, curve);
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        particleSystem.rotation.y += 0.002;
        curve.rotation.y += 0.002;
        
        renderer.render(scene, camera);
    }
    
    animate();
    
    // Handle window resize
    window.addEventListener('resize', function() {
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    });
}

// Oracle functionality powered by Gemini
function initOracle() {
    // DOM Elements
    const oracleMessages = document.getElementById('oracle-messages');
    const oracleForm = document.getElementById('oracle-form');
    const oracleQuestion = document.getElementById('oracle-question');
    const askButton = document.getElementById('ask-oracle');
    const apiKeyContainer = document.getElementById('api-key-container');
    const apiKeyInput = document.getElementById('gemini-api-key');
    const saveApiKeyButton = document.getElementById('save-api-key');
    
    // Check for saved API key
    const savedApiKey = localStorage.getItem('gemini-api-key');
    if (savedApiKey) {
        apiKeyContainer.style.display = 'none';
        oracleQuestion.disabled = false;
        askButton.disabled = false;
        
        // Add a message indicating the oracle is ready
        addMessage('system', 'The Oracle is ready to answer your questions about Alex...');
    }
    
    // Event listeners
    saveApiKeyButton.addEventListener('click', saveApiKey);
    oracleForm.addEventListener('submit', askOracle);
    
    // Save API key to localStorage
    function saveApiKey() {
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            showError('Please enter a valid API key');
            return;
        }
        
        // Validate API key format (basic check)
        if (!apiKey.startsWith('AI') && apiKey.length < 20) {
            showError('That doesn\'t look like a valid Gemini API key');
            return;
        }
        
        // Save to localStorage
        localStorage.setItem('gemini-api-key', apiKey);
        
        // Update UI
        apiKeyContainer.style.display = 'none';
        oracleQuestion.disabled = false;
        askButton.disabled = false;
        
        addMessage('system', 'API key saved! The Oracle is now ready to answer your questions about Alex...');
    }
    
    // Send message to Oracle (Gemini API)
    async function askOracle(event) {
        event.preventDefault();
        
        const question = oracleQuestion.value.trim();
        if (!question) return;
        
        // Clear input
        oracleQuestion.value = '';
        
        // Add user message to chat
        addMessage('user', question);
        
        // Show typing indicator
        showTypingIndicator();
        
        // Get API key
        const apiKey = localStorage.getItem('gemini-api-key');
        if (!apiKey) {
            removeTypingIndicator();
            showError('API key not found. Please provide your Gemini API key.');
            apiKeyContainer.style.display = 'block';
            return;
        }
        
        try {
            // Prepare the prompt with context
            const prompt = `You are a mystical Oracle on Alex Taylor's personal website. Alex is a mathematician and educator with expertise in dynamical systems, differential geometry, and mathematical visualization. Their research focuses on these areas with applications to machine learning. 

You should respond to questions about Alex in a mysterious, slightly poetic tone, as if you're an all-knowing entity. For questions about math or Alex's expertise, provide insightful, accurate responses that showcase Alex's knowledge. 

If asked about personal details not specified here, weave a creative response that aligns with the image of a mathematician passionate about visualization and education. Keep responses concise and engaging.

User question: ${question}`;
            
            // Call Gemini API
            const response = await fetchGeminiResponse(apiKey, prompt);
            
            // Remove typing indicator
            removeTypingIndicator();
            
            // Add oracle's response
            addMessage('oracle', response);
            
        } catch (error) {
            // Remove typing indicator
            removeTypingIndicator();
            
            // Show error
            showError(`Oracle connection failed: ${error.message}`);
        }
    }
    
    // Call Gemini API with user message
    async function fetchGeminiResponse(apiKey, prompt) {
        const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
        const url = `${endpoint}?key=${apiKey}`;
        
        const data = {
            contents: [
                {
                    parts: [
                        {
                            text: prompt
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 800
            }
        };
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                if (response.status === 400) {
                    const errorData = await response.json();
                    throw new Error(errorData.error.message || 'Invalid request to Gemini API');
                } else if (response.status === 403) {
                    throw new Error('API key invalid or unauthorized');
                } else {
                    throw new Error(`HTTP error ${response.status}`);
                }
            }
            
            const responseData = await response.json();
            
            // Extract and return text from Gemini response
            if (responseData.candidates && 
                responseData.candidates[0] && 
                responseData.candidates[0].content && 
                responseData.candidates[0].content.parts && 
                responseData.candidates[0].content.parts[0] &&
                responseData.candidates[0].content.parts[0].text) {
                
                return responseData.candidates[0].content.parts[0].text;
            } else {
                throw new Error('Unexpected response format from Gemini API');
            }
            
        } catch (error) {
            console.error('Gemini API error:', error);
            throw error;
        }
    }
    
    // Add message to chat
    function addMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `oracle-message ${type}`;
        
        // Process content - split paragraphs
        const paragraphs = content.split('\n').filter(p => p.trim() !== '');
        
        paragraphs.forEach(paragraph => {
            const p = document.createElement('p');
            p.textContent = paragraph;
            messageDiv.appendChild(p);
        });
        
        oracleMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        oracleMessages.scrollTop = oracleMessages.scrollHeight;
    }
    
    // Show error message
    function showError(message) {
        addMessage('system', `⚠️ ${message}`);
    }
    
    // Show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'oracle-message oracle typing-message';
        
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'typing-dot';
            typingIndicator.appendChild(dot);
        }
        
        typingDiv.appendChild(typingIndicator);
        oracleMessages.appendChild(typingDiv);
        
        // Scroll to bottom
        oracleMessages.scrollTop = oracleMessages.scrollHeight;
    }
    
    // Remove typing indicator
    function removeTypingIndicator() {
        const typingMessage = document.querySelector('.typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
    }
}

// Creates a smooth curve through selected points of the attractor
function createCurveThroughAttractor(positions, totalPoints) {
    // Select a subset of points for the curve (every 50th point)
    const curvePoints = [];
    const step = 50;
    
    for (let i = 0; i < totalPoints; i += step) {
        const x = positions[i * 3];
        const y = positions[i * 3 + 1];
        const z = positions[i * 3 + 2];
        
        curvePoints.push(new THREE.Vector3(x, y, z));
    }
    
    // Close the loop
    const firstPoint = new THREE.Vector3(
        positions[0],
        positions[1],
        positions[2]
    );
    curvePoints.push(firstPoint);
    
    // Create a smooth curve through the points
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    
    // Create the tube geometry that follows the curve
    const tubeGeometry = new THREE.TubeGeometry(
        curve,
        150,   // tubular segments
        0.03,  // radius
        8,     // radial segments
        false  // closed
    );
    
    // Create gradient materials
    const tubeMaterial = new THREE.MeshPhongMaterial({
        color: 0x6e56cf,
        emissive: 0x2a1a6c,
        shininess: 100,
        transparent: true,
        opacity: 0.8
    });
    
    return new THREE.Mesh(tubeGeometry, tubeMaterial);
}

// Add mouse controls for rotation
function addMouseControls(container, ...objects) {
    let isDragging = false;
    let previousMousePosition = {
        x: 0,
        y: 0
    };
    
    container.addEventListener('mousedown', function(e) {
        isDragging = true;
    });
    
    document.addEventListener('mousemove', function(e) {
        if (isDragging) {
            const deltaMove = {
                x: e.offsetX - previousMousePosition.x,
                y: e.offsetY - previousMousePosition.y
            };
            
            if (previousMousePosition.x === 0 && previousMousePosition.y === 0) {
                deltaMove.x = 0;
                deltaMove.y = 0;
            }
            
            for (const object of objects) {
                object.rotation.y += deltaMove.x * 0.01;
                object.rotation.x += deltaMove.y * 0.01;
            }
        }
        
        previousMousePosition = {
            x: e.offsetX,
            y: e.offsetY
        };
    });
    
    document.addEventListener('mouseup', function(e) {
        isDragging = false;
    });
    
    // Add touch support for mobile devices
    container.addEventListener('touchstart', function(e) {
        isDragging = true;
        previousMousePosition = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
        e.preventDefault();
    });
    
    document.addEventListener('touchmove', function(e) {
        if (isDragging) {
            const deltaMove = {
                x: e.touches[0].clientX - previousMousePosition.x,
                y: e.touches[0].clientY - previousMousePosition.y
            };
            
            for (const object of objects) {
                object.rotation.y += deltaMove.x * 0.01;
                object.rotation.x += deltaMove.y * 0.01;
            }
            
            previousMousePosition = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        }
        e.preventDefault();
    });
    
    document.addEventListener('touchend', function(e) {
        isDragging = false;
        e.preventDefault();
    });
    
    // Add mouse wheel zoom
    container.addEventListener('wheel', function(e) {
        for (const object of objects) {
            const scale = object.scale.x - Math.sign(e.deltaY) * 0.1;
            
            // Limit zoom scale
            if (scale > 0.5 && scale < 2) {
                object.scale.set(scale, scale, scale);
            }
        }
        e.preventDefault();
    });
}

// Animation for the header on the literature page
function initBookPageAnimation() {
    const container = document.getElementById('header-animation');
    if (!container) return;
    
    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    
    // Camera position
    camera.position.z = 15;
    
    // Create mathematical symbols
    const symbols = ['π', '∫', '∑', '∞', '√', 'λ', 'Δ', '∇', 'Ω', 'θ', 'φ'];
    const fontLoader = new THREE.FontLoader();
    
    // Generate random equations and formulas
    const formulas = [
        'e^{iπ} + 1 = 0',
        '∫_0^∞ e^{-x^2} dx = \\frac{\\sqrt{π}}{2}',
        'F_{n+2} = F_{n+1} + F_n',
        '\\sum_{n=0}^{∞} \\frac{1}{n!} = e',
        'E = mc^2',
        'A = πr^2',
        'P(A|B) = \\frac{P(B|A)P(A)}{P(B)}'
    ];
    
    // Array to hold all the objects
    const floatingObjects = [];
    
    // Create floating mathematical symbols with fontLoader
    for (let i = 0; i < 40; i++) {
        // Create a simple geometric shape for each symbol
        let geometry;
        const type = Math.floor(Math.random() * 3);
        
        if (type === 0) {
            // Small sphere for dot-like symbols
            geometry = new THREE.SphereGeometry(0.2, 8, 8);
        } else if (type === 1) {
            // Thin box for line-like symbols
            geometry = new THREE.BoxGeometry(0.8, 0.1, 0.1);
        } else {
            // Circular shape for circular symbols
            geometry = new THREE.TorusGeometry(0.2, 0.05, 8, 16);
        }
        
        // Create material with gradient-like color
        const hue = Math.random();
        const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(hue, 0.7, 0.6),
            transparent: true,
            opacity: 0.4 + Math.random() * 0.3
        });
        
        const symbol = new THREE.Mesh(geometry, material);
        
        // Random position within view
        symbol.position.x = (Math.random() - 0.5) * 30;
        symbol.position.y = (Math.random() - 0.5) * 15;
        symbol.position.z = (Math.random() - 0.5) * 10;
        
        // Random rotation
        symbol.rotation.x = Math.random() * Math.PI;
        symbol.rotation.y = Math.random() * Math.PI;
        
        // Random scale
        const scale = 0.5 + Math.random() * 1.5;
        symbol.scale.set(scale, scale, scale);
        
        // Random movement values
        symbol.userData = {
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            movementSpeed: 0.01 + Math.random() * 0.02,
            direction: new THREE.Vector3(
                (Math.random() - 0.5) * 0.01,
                (Math.random() - 0.5) * 0.01,
                (Math.random() - 0.5) * 0.01
            )
        };
        
        scene.add(symbol);
        floatingObjects.push(symbol);
    }
    
    // Create connecting lines between nearby symbols
    const linesMaterial = new THREE.LineBasicMaterial({
        color: 0x6e56cf,
        transparent: true,
        opacity: 0.2
    });
    
    const lines = [];
    
    function updateConnectingLines() {
        // Remove old lines
        for (const line of lines) {
            scene.remove(line);
        }
        lines.length = 0;
        
        // Create new lines between objects that are close to each other
        for (let i = 0; i < floatingObjects.length; i++) {
            const obj1 = floatingObjects[i];
            
            for (let j = i + 1; j < floatingObjects.length; j++) {
                const obj2 = floatingObjects[j];
                
                // Calculate distance between objects
                const distance = obj1.position.distanceTo(obj2.position);
                
                // If they're close enough, create a line between them
                if (distance < 5) {
                    const geometry = new THREE.BufferGeometry().setFromPoints([
                        obj1.position,
                        obj2.position
                    ]);
                    
                    const line = new THREE.Line(geometry, linesMaterial);
                    scene.add(line);
                    lines.push(line);
                }
            }
        }
    }
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Update each object's position and rotation
        for (const obj of floatingObjects) {
            // Rotation
            obj.rotation.x += obj.userData.rotationSpeed;
            obj.rotation.y += obj.userData.rotationSpeed * 0.7;
            
            // Movement
            obj.position.add(obj.userData.direction);
            
            // Bounce off imaginary walls
            if (Math.abs(obj.position.x) > 15) {
                obj.userData.direction.x *= -1;
            }
            if (Math.abs(obj.position.y) > 8) {
                obj.userData.direction.y *= -1;
            }
            if (Math.abs(obj.position.z) > 5) {
                obj.userData.direction.z *= -1;
            }
        }
        
        // Update connecting lines every few frames for performance
        if (Math.random() < 0.05) {
            updateConnectingLines();
        }
        
        renderer.render(scene, camera);
    }
    
    animate();
    
    // Handle window resize
    window.addEventListener('resize', function() {
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    });
}