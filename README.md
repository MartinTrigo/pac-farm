# Huerta-Man

Un clásico de laberinto con temática de producción frutihortícola, en pixel art.
Se juega en el navegador, sin instalar nada.

**Jugar: https://martintrigo.github.io/huerta-man/**

## De qué se trata

Manejás al cosechador por la huerta juntando la producción, mientras cuatro
plagas te persiguen.

| | |
|---|---|
| 🥬 **Rabanitos** | 10 puntos cada uno |
| 🤍 **Nabos** | 25 puntos, aparecen salteados entre los rabanitos |
| 🍓 **Frutillas** | 50 puntos. Están en las cuatro esquinas y por unos segundos dan vuelta la cosa: las plagas se asustan y las podés comer (200, 400, 800 y 1600 puntos seguidas) |
| 🍅 **Tomate** | de 100 a 500 puntos según el nivel. Aparece dos veces por nivel, abajo de la madriguera, y se va solo |

Las plagas son **vaquita**, **pulgón**, **mosca blanca** y **babosa**, y cada
una tiene su maña: la vaquita va derecho a buscarte, el pulgón se te adelanta,
la mosca blanca te encierra y la babosa se acerca pero se asusta de cerca. Cada
tanto se dispersan a su rincón y después vuelven a la carga.

Tenés tres vidas y los niveles se van poniendo más rápidos.

## Controles

| | |
|---|---|
| Computadora | flechas o **WASD** · **P** para pausar |
| Celular | deslizá el dedo sobre el tablero o usá las flechas de abajo |

En el celular conviene **"Agregar a pantalla de inicio"** desde el menú del
navegador: queda como una app, a pantalla completa.

## Cómo está hecho

HTML, CSS y JavaScript sin librerías ni dependencias. Todo se dibuja en un
lienzo de 224×288 píxeles que después se agranda a la pantalla, así que el
pixel art se mantiene nítido. Los dibujos no son imágenes: se generan por
código a partir de mapas de píxeles, y el cosechador se calcula redondeando un
círculo al que se le recorta la boca.

| Archivo | Qué tiene |
|---|---|
| `index.html` | la pantalla y los botones |
| `estilo.css` | los colores y la cruceta del celular |
| `juego.js` | el laberinto, los dibujos, la inteligencia de las plagas y el bucle del juego |

## Para sumarlo a MonAgric

La carpeta es autónoma: se puede copiar entera dentro de `docs/juego/` del
repositorio [MonAgric](https://github.com/MartinTrigo/MonAgric) y queda
disponible en `.../MonAgric/juego/`, sin tocar nada de la aplicación.
