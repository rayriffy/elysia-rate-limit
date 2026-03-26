# Benchmark Results

We do have a benchmark script that you can run to see the results.

To run the benchmark, you can use the following command:

```bash
bun run benchmark/index.ts
```

Here's the current benchmark results, in theory when plugin were used the performance should be slower than without plugin. So our benchmark target is to reduce the performance difference as much as possible.

```shell
clk: ~4.22 GHz
cpu: Apple M4
runtime: bun 1.3.11 (arm64-darwin)

benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
Without Rate Limit           398.00 ns/iter 334.00 ns  █▇                  
                     (208.00 ns … 68.71 µs)   1.38 µs  ██                  
                    (  0.00  b …  64.00 kb) 196.55  b ▁██▄▇▃▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁

With Rate Limit (Default)      1.88 µs/iter   1.83 µs  █                   
                      (1.33 µs … 457.00 µs)   5.96 µs  ██                  
                    (  0.00  b … 144.00 kb) 218.60  b ▂██▇▂▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁

With Rate Limit (Custom)       1.96 µs/iter   1.92 µs  ▄█                  
                      (1.42 µs … 502.75 µs)   5.79 µs  ██                  
                    (  0.00  b … 176.00 kb) 362.97  b ▁██▇▃▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁

                             ┌                                            ┐
                             ╷┬       ╷
          Without Rate Limit ├│───────┤
                             ╵┴       ╵
                                      ╷ ┌─┬                               ╷
   With Rate Limit (Default)          ├─┤ │───────────────────────────────┤
                                      ╵ └─┴                               ╵
                                      ╷  ┌─┬                             ╷
    With Rate Limit (Custom)          ├──┤ │─────────────────────────────┤
                                      ╵  └─┴                             ╵
                             └                                            ┘
                             208.00 ns           3.08 µs            5.96 µs

summary
  Without Rate Limit
   4.71x faster than With Rate Limit (Default)
   4.93x faster than With Rate Limit (Custom)
```
