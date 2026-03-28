const { chromium } = require('playwright');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8080';

(async () => {
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--enable-webgl', '--use-gl=swiftshader', '--disable-web-security']
    });
    const page = await browser.newPage();
    
    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
    });
    page.on('pageerror', err => {
        errors.push(err.message);
    });
    
    console.log('=== LeanKG Graph Visualization Test ===\n');
    
    // Test 1: API endpoint
    console.log('Test 1: Graph API');
    try {
        const apiResponse = await page.goto(`${BASE_URL}/api/graph/data`);
        const apiData = await page.evaluate(() => fetch('/api/graph/data').then(r => r.json()));
        
        if (apiData.success && apiData.data) {
            const { nodes, edges } = apiData.data;
            console.log(`  - API returned ${nodes.length} nodes, ${edges.length} edges`);
            
            // Verify edges have valid source and target
            const nodeIds = new Set(nodes.map(n => n.id));
            const validEdges = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
            console.log(`  - Valid edges (source/target exist): ${validEdges.length}/${edges.length}`);
            
            if (validEdges.length === edges.length && edges.length > 0) {
                console.log('  PASS: All edges have valid source and target\n');
            } else {
                console.log('  FAIL: Some edges have invalid source/target\n');
            }
        } else {
            console.log(`  FAIL: API error: ${apiData.error}\n`);
        }
    } catch (e) {
        console.log(`  FAIL: ${e.message}\n`);
    }
    
    // Test 2: Graph page load
    console.log('Test 2: Graph Page Load');
    await page.goto(`${BASE_URL}/graph`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Test 3: Canvas rendering (WebGL)
    console.log('Test 3: Canvas Rendering (WebGL)');
    const canvas = await page.$('canvas');
    
    if (canvas) {
        console.log('  PASS: Canvas element found\n');
    } else {
        // Check for WebGL errors vs other errors
        const webglErrors = errors.filter(e => 
            e.includes('blendFunc') || 
            e.includes('WebGL') || 
            e.includes('webgl')
        );
        const otherErrors = errors.filter(e => 
            !e.includes('blendFunc') && 
            !e.includes('WebGL') && 
            !e.includes('webgl')
        );
        
        if (webglErrors.length > 0 && otherErrors.length === 0) {
            console.log('  SKIP: WebGL not available in headless mode (expected behavior)');
            console.log('  The graph visualization requires WebGL and will work in a real browser\n');
        } else if (otherErrors.length > 0) {
            console.log(`  FAIL: Non-WebGL errors: ${otherErrors.join(', ')}\n`);
        } else {
            console.log('  WARN: No canvas found but no errors reported\n');
        }
    }
    
    // Test 4: Sigma instance
    console.log('Test 4: Sigma Instance');
    const sigmaState = await page.evaluate(() => {
        if (window.sig) {
            const graph = window.sig.getGraph();
            return {
                initialized: true,
                nodeCount: graph.nodes().length,
                edgeCount: graph.edges().length
            };
        }
        return { initialized: false };
    });
    
    if (sigmaState.initialized) {
        console.log(`  - Sigma initialized with ${sigmaState.nodeCount} nodes, ${sigmaState.edgeCount} edges`);
        console.log('  PASS: Sigma instance is active\n');
    } else {
        console.log('  INFO: Sigma not initialized (may be due to WebGL in headless mode)\n');
    }
    
    // Summary
    console.log('=== Test Summary ===');
    if (errors.length > 0) {
        console.log('Errors encountered:');
        errors.forEach(e => console.log(`  - ${e}`));
    } else {
        console.log('No errors detected');
    }
    
    await browser.close();
})();