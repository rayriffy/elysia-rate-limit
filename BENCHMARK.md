# Benchmark Results

We do have a benchmark script that you can run to see the results.

To run the benchmark, you can use the following command:

```bash
bun run benchmark/index.ts
```

Here's the current benchmark results, in theory when plugin were used the performance should be slower than without plugin. So our benchmark target is to reduce the performance difference as much as possible.

```shell
clk: ~4.20 GHz
cpu: Apple M4
runtime: bun 1.3.11 (arm64-darwin)

benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
Without Rate Limit           399.66 ns/iter 375.00 ns  █▅                  
                    (208.00 ns … 263.08 µs)   1.79 µs  ██                  
                    (  0.00  b …  48.00 kb) 193.32  b ▁██▇▃▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁

With Rate Limit (Default)      1.99 µs/iter   1.92 µs  █                   
                      (1.29 µs … 565.92 µs)   7.00 µs  ██                  
                    (  0.00  b … 128.00 kb) 223.04  b ▂██▆▃▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁

With Rate Limit (Custom)       2.03 µs/iter   2.00 µs  █▄                  
                      (1.38 µs … 480.67 µs)   6.67 µs  ██                  
                    (  0.00  b … 512.00 kb) 379.38  b ▂███▃▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁

                             ┌                                            ┐
                             ╷┬        ╷
          Without Rate Limit ├│────────┤
                             ╵┴        ╵
                                    ╷ ┌──┬                                ╷
   With Rate Limit (Default)        ├─┤  │────────────────────────────────┤
                                    ╵ └──┴                                ╵
                                     ╷ ┌─┬                              ╷
    With Rate Limit (Custom)         ├─┤ │──────────────────────────────┤
                                     ╵ └─┴                              ╵
                             └                                            ┘
                             208.00 ns           3.60 µs            7.00 µs

summary
  Without Rate Limit
   4.98x faster than With Rate Limit (Default)
   5.08x faster than With Rate Limit (Custom)
```
