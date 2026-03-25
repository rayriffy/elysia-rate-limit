```
clk: ~4.21 GHz
cpu: Apple M4
runtime: bun 1.3.11 (arm64-darwin)

benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
Without Rate Limit           388.72 ns/iter 334.00 ns  █▂                  
                    (208.00 ns … 276.54 µs)   1.50 µs  ██                  
                    (  0.00  b …  64.00 kb) 186.04  b ▁██▇▂▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁

With Rate Limit (Default)      2.21 µs/iter   2.17 µs  █                   
                      (1.58 µs … 527.21 µs)   6.79 µs  █▇                  
                    (  0.00  b … 208.00 kb) 247.60  b ▄██▆▃▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁

With Rate Limit (Custom)       2.35 µs/iter   2.29 µs  █                   
                      (1.67 µs … 527.38 µs)   7.33 µs  ██                  
                    (  0.00  b … 368.00 kb) 431.21  b ▃██▇▃▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁

                             ┌                                            ┐
                             ╷┬      ╷
          Without Rate Limit ├│──────┤
                             ╵┴      ╵
                                      ╷ ┌─┬                            ╷
   With Rate Limit (Default)          ├─┤ │────────────────────────────┤
                                      ╵ └─┴                            ╵
                                      ╷ ┌──┬                              ╷
    With Rate Limit (Custom)          ├─┤  │──────────────────────────────┤
                                      ╵ └──┴                              ╵
                             └                                            ┘
                             208.00 ns           3.77 µs            7.33 µs

summary
  Without Rate Limit
   5.7x faster than With Rate Limit (Default)
   6.05x faster than With Rate Limit (Custom)
```