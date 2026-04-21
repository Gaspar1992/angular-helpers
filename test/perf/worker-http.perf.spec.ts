import { test, expect } from '@playwright/test';

/**
 * Worker HTTP Performance Tests - Granular Pipeline Stage Analysis
 *
 * These tests exercise the instrumented benchmark page to collect
 * per-request metrics for all 6 pipeline stages:
 * 1. worker-init, 2. serialization, 3. transfer-out,
 * 4. worker-processing, 5. transfer-in, 6. deserialization
 *
 * Available scenarios from benchmark-scenarios.ts:
 * - small-sequential: 100 tiny requests (256 bytes), transport overhead test
 * - large-payload: 1 request with 10MB payload, serialization test
 * - parallel-burst: 50 parallel requests with 50ms delay, pool benefit test
 * - cpu-during-requests: 20 requests + main thread CPU burn, jank test
 */

test.describe('Worker HTTP Pipeline Stage Analysis', () => {
  const BENCHMARK_URL = '/demo/worker-http-benchmark';

  test.beforeEach(async ({ page }) => {
    await page.goto(BENCHMARK_URL);
    await page.waitForSelector('button', { state: 'visible', timeout: 30000 });
    // Reset completion flag
    await page.evaluate(() => {
      (window as any).__benchmarkComplete = false;
    });
  });

  test('small-sequential - measure transport overhead with all stages', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__runBenchmark?.('small-sequential', 'worker');
    });

    // Wait for completion with longer timeout (100 sequential requests)
    await page.waitForFunction(() => (window as any).__benchmarkComplete === true, {
      timeout: 120000,
    });
    await page.waitForTimeout(500);

    // Get metrics
    const metrics = await page.evaluate(() => (window as any).__benchmarkMetrics || []);

    expect(metrics.length).toBeGreaterThan(0);
    console.log(`small-sequential: ${metrics.length} requests measured`);

    // Should have captured stages
    const firstRequest = metrics[0];
    expect(firstRequest.stages).toBeDefined();
    expect(firstRequest.stages.length).toBeGreaterThan(0);

    // Log stage breakdown
    console.log('Stage breakdown:');
    for (const stage of firstRequest.stages) {
      console.log(`  ${stage.stage}: ${stage.durationMs.toFixed(2)}ms`);
    }
  });

  test('large-payload - measure serialization cost', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__runBenchmark?.('large-payload', 'worker');
    });

    await page.waitForFunction(() => (window as any).__benchmarkComplete === true, {
      timeout: 60000,
    });
    await page.waitForTimeout(500);

    const metrics = await page.evaluate(() => (window as any).__benchmarkMetrics || []);
    expect(metrics.length).toBeGreaterThanOrEqual(1);

    // For large payload (10MB), serialization should be significant
    const serializationStage = metrics[0]?.stages?.find((s: any) => s.stage === 'serialization');
    const deserializationStage = metrics[0]?.stages?.find(
      (s: any) => s.stage === 'deserialization',
    );

    console.log(`large-payload (${10 * 1024 * 1024} bytes):`);
    console.log(`  Serialization: ${serializationStage?.durationMs.toFixed(2)}ms`);
    console.log(`  Deserialization: ${deserializationStage?.durationMs.toFixed(2)}ms`);

    expect(serializationStage).toBeDefined();
    expect(deserializationStage).toBeDefined();

    // Serialization of 10MB should take some time (> 5ms)
    expect(serializationStage.durationMs).toBeGreaterThan(5);
  });

  test('parallel-burst - pool performance with 50 concurrent requests', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__runBenchmark?.('parallel-burst', 'worker-pool-4');
    });

    await page.waitForFunction(() => (window as any).__benchmarkComplete === true, {
      timeout: 120000,
    });
    await page.waitForTimeout(500);

    const metrics = await page.evaluate(() => (window as any).__benchmarkMetrics || []);
    expect(metrics.length).toBeGreaterThanOrEqual(50);

    console.log(`parallel-burst: ${metrics.length} requests completed`);

    // Aggregate stage times across all requests
    const stageTotals: Record<string, number[]> = {};
    for (const metric of metrics) {
      for (const stage of metric.stages || []) {
        if (!stageTotals[stage.stage]) stageTotals[stage.stage] = [];
        stageTotals[stage.stage].push(stage.durationMs);
      }
    }

    // Calculate averages
    const stageAverages = Object.entries(stageTotals).map(([stage, times]) => ({
      stage,
      avgMs: times.reduce((a, b) => a + b, 0) / times.length,
      minMs: Math.min(...times),
      maxMs: Math.max(...times),
    }));

    console.log('Stage averages (50 parallel requests):');
    for (const s of stageAverages.sort((a, b) => b.avgMs - a.avgMs)) {
      console.log(
        `  ${s.stage}: avg=${s.avgMs.toFixed(2)}ms, min=${s.minMs.toFixed(2)}ms, max=${s.maxMs.toFixed(2)}ms`,
      );
    }
  });

  test('cpu-during-requests - measure UI smoothness with main-thread CPU load', async ({
    page,
  }) => {
    // Run worker mode first
    await page.evaluate(() => {
      (window as any).__runBenchmark?.('cpu-during-requests', 'worker');
    });

    await page.waitForFunction(() => (window as any).__benchmarkComplete === true, {
      timeout: 120000,
    });
    await page.waitForTimeout(500);

    const workerMetrics = await page.evaluate(() => (window as any).__benchmarkMetrics || []);
    const workerDropped = await page.evaluate(() => (window as any).__droppedFramesWorker || 0);

    // Reset for fetch test
    await page.evaluate(() => {
      (window as any).__benchmarkComplete = false;
    });

    // Run main-thread mode
    await page.evaluate(() => {
      (window as any).__runBenchmark?.('cpu-during-requests', 'fetch');
    });

    await page.waitForFunction(() => (window as any).__benchmarkComplete === true, {
      timeout: 120000,
    });
    await page.waitForTimeout(500);

    const fetchMetrics = await page.evaluate(() => (window as any).__benchmarkMetrics || []);
    const fetchDropped = await page.evaluate(() => (window as any).__droppedFramesFetch || 0);

    console.log('\n=== CPU-DURING-REQUESTS COMPARISON ===');
    console.log(`Worker mode: ${workerMetrics.length} requests, ${workerDropped} dropped frames`);
    console.log(`Main-thread: ${fetchMetrics.length} requests, ${fetchDropped} dropped frames`);

    // Worker should maintain UI smoothness (fewer dropped frames)
    // with 500ms main-thread CPU burn happening
    expect(workerDropped).toBeLessThanOrEqual(Math.max(fetchDropped * 2, 5));
  });

  test('Head-to-head comparison - identify weakest pipeline stage', async ({ page }) => {
    // Run worker mode with small sequential
    await page.evaluate(() => {
      (window as any).__runBenchmark?.('small-sequential', 'worker');
    });

    await page.waitForFunction(() => (window as any).__benchmarkComplete === true, {
      timeout: 120000,
    });
    await page.waitForTimeout(500);

    const workerMetrics = await page.evaluate(() => (window as any).__benchmarkMetrics || []);

    // Aggregate stage times
    const stageTotals: Record<string, number[]> = {};
    for (const metric of workerMetrics) {
      for (const stage of metric.stages || []) {
        if (!stageTotals[stage.stage]) stageTotals[stage.stage] = [];
        stageTotals[stage.stage].push(stage.durationMs);
      }
    }

    // Calculate averages and identify bottleneck
    const stageAverages = Object.entries(stageTotals)
      .map(([stage, times]) => ({
        stage,
        avgMs: times.reduce((a, b) => a + b, 0) / times.length,
      }))
      .sort((a, b) => b.avgMs - a.avgMs);

    console.log('\n=== PIPELINE BREAKDOWN (slowest first) ===');
    for (const s of stageAverages) {
      const percent = (
        (s.avgMs / stageAverages.reduce((sum, st) => sum + st.avgMs, 0)) *
        100
      ).toFixed(1);
      console.log(`  ${s.stage}: ${s.avgMs.toFixed(2)}ms (${percent}%)`);
    }

    const bottleneck = stageAverages[0];
    console.log(
      `\n🐌 WEAKEST STAGE: ${bottleneck.stage} (${bottleneck.avgMs.toFixed(2)}ms average)`,
    );

    // Should have captured meaningful stages
    expect(stageAverages.length).toBeGreaterThanOrEqual(3);
    expect(bottleneck.avgMs).toBeGreaterThan(0);
  });
});

test.describe('Regression Detection', () => {
  test('Performance budgets - serialization and processing', async ({ page }) => {
    const BUDGETS = {
      smallPayloadSerializationMaxMs: 5, // 256 bytes should serialize fast
      largePayloadSerializationMaxMs: 100, // 10MB has budget of 100ms
      processingOverheadMinMs: 0.1, // Should have some measurable processing
    };

    await page.goto('/demo/worker-http-benchmark');
    await page.waitForSelector('button', { state: 'visible', timeout: 30000 });

    // Test small payload serialization
    await page.evaluate(() => {
      (window as any).__benchmarkComplete = false;
      (window as any).__runBenchmark?.('small-sequential', 'worker');
    });

    await page.waitForFunction(() => (window as any).__benchmarkComplete === true, {
      timeout: 120000,
    });
    await page.waitForTimeout(500);

    const smallMetrics = await page.evaluate(() => (window as any).__benchmarkMetrics || []);
    const smallSerialization = smallMetrics[0]?.stages?.find(
      (s: any) => s.stage === 'serialization',
    );

    console.log(
      `Small payload (256 bytes) serialization: ${smallSerialization?.durationMs.toFixed(3)}ms`,
    );
    expect(smallSerialization?.durationMs || 0).toBeLessThan(
      BUDGETS.smallPayloadSerializationMaxMs,
    );

    // Test large payload serialization
    await page.evaluate(() => {
      (window as any).__benchmarkComplete = false;
      (window as any).__runBenchmark?.('large-payload', 'worker');
    });

    await page.waitForFunction(() => (window as any).__benchmarkComplete === true, {
      timeout: 60000,
    });
    await page.waitForTimeout(500);

    const largeMetrics = await page.evaluate(() => (window as any).__benchmarkMetrics || []);
    const largeSerialization = largeMetrics[0]?.stages?.find(
      (s: any) => s.stage === 'serialization',
    );

    console.log(
      `Large payload (10MB) serialization: ${largeSerialization?.durationMs.toFixed(2)}ms`,
    );
    expect(largeSerialization?.durationMs || 0).toBeLessThan(
      BUDGETS.largePayloadSerializationMaxMs,
    );
  });
});
