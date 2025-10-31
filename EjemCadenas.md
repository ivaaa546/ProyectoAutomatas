CADENAS VÁLIDAS (ACEPTADAS)              Cadena minima: aabxcaa 
                                            Cadena promedio: aabbxyyccaaa
aabxcaa
aabbxyyyccaa
aaabbxyyccaaa
n=2, m=1:
aabxcaa 
aabxycaa (con y's)
aabxyycaa  (múltiples y's)
n=3, m=1:
aaabxcaaa 
aaabxycaaa 
n=2, m=2:
aabbxccaa 
aabbxyccaa 
n=3, m=2:
aaabbxccaaa 
aaabbxyyccaaa 

n=5, m=3:
aaaaabbbxyycccaaaaa 
aaaaabbbxyyyycccaaaaa 
aaaaabbbxyyyyyyycccaaaaa 
n=4, m=4:
aaaabbbbxyyyyccccaaaa 
aaaabbbbxyyyyyyyyccccaaaa 
n=6, m=2:
aaaaaabbxyyccaaaaaa 
aaaaaabbxyyyyyyyccaaaaaa 
n=3, m=5:
aaabbbbbxyyyycccccaaa 
aaabbbbbxyyyyyyyyycccccaaa 
n=7, m=1:
aaaaaaabxycaaaaaaa 
aaaaaaabxyyyyycaaaaaaa 

aaaaabbbxyycccaaaaa
aaaabbbbxyyyyyyyyccccaaaa
aaaaaabbxyyyyyyyccaaaaaa

X CADENAS INVÁLIDAS (RECHAZADAS)
aabbxcccaa
aabxca
abxyca
n < 2 (muy pocas 'a's iniciales):
abxca (n=1, m=1)
abxyca (n=1, m=1)
abxyyca  (n=1, m=1)
m < 1 (sin 'b's o 'c's):
aaxaa  (n=2, m=0)
aaxyxaa  (n=2, m=0)

Desbalanceo en 'a's:
aabxca  (n=2 inicial, n=1 final)
aabxcaaa  (n=2 inicial, n=3 final)
Desbalanceo en 'b's y 'c's:
aabbxcaa  (m=2 'b's, m=1 'c')
aabxccaa  (m=1 'b', m=2 'c's)
Falta 'x' obligatoria:
aabcaa  (falta 'x')
aabcyaa  (falta 'x')
Orden incorrecto:
aabxca  (falta 'a' final)
baaxcaa  (empieza con 'b')
aabxacaa  ('a' en posición incorrecta)
Símbolos no permitidos:
aabxdaa  (símbolo 'd' no está en Σ)
aabx1aa  (símbolo '1' no está en Σ)

n < 2 (muy pocas 'a's iniciales):
abbbbbxyyyyccccc  (n=1, m=5)
abbbbbxyyyyyyyyccccc  (n=1, m=5)
Desbalanceo en 'a's:
aaaaabbbxyycccaaaa  (n=5 inicial, n=4 final)
aaaabbbbxyyyyccccaaaaa  (n=4 inicial, n=5 final)
Desbalanceo en 'b's y 'c's:
aaaaabbbbxyycccaaaaa  (m=4 'b's, m=3 'c's)
aaaaabbbxyyccccaaaaa  (m=3 'b's, m=4 'c's)
Falta 'x' obligatoria:
aaaaabbbbyyyycccca  (falta 'x')
aaaaabbbbyyyyyyyycccca  (falta 'x')
Orden incorrecto:
aaaaabbbxyycccaaaa  (falta una 'a' final)
aaaaabbbxyycccaaaaaa  (sobra una 'a' final)
Símbolos no permitidos:
aaaaabbbxyycccaaaaa  (símbolo 'z' no está en Σ)
aaaaabbbxyycccaaaaa  (símbolo '9' no está en Σ)