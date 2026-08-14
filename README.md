# Pac-Farm

Un clásico de laberinto con temática de producción frutihortícola, en pixel art.
Se juega en el navegador, sin instalar nada.

**Jugar: https://martintrigo.github.io/pac-farm/**

## De qué se trata

Manejás a un cosechador con sombrero de paja que recorre la huerta juntando la
producción, mientras cuatro plagas lo persiguen.

| | |
|---|---|
| 🥬 **Rabanitos** | 10 puntos cada uno |
| 🤍 **Nabos** | 25 puntos, aparecen salteados entre los rabanitos |
| 🍓 **Frutillas** | 50 puntos. Están en las cuatro esquinas, laten para que se las vea, y por unos segundos dan vuelta la cosa: las plagas se asustan y las podés comer (200, 400, 800 y 1600 puntos seguidas) |
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
| Celular | el **joystick** del medio: apoyás el dedo en la rueda y lo deslizás hacia donde querés ir, sin levantarlo |
| Celular | o los **botones de los costados**: arriba y abajo con un pulgar, izquierda y derecha con el otro |

Al perder la última vida hay que **tocar de nuevo** para volver a empezar, y
recién después de un segundo y medio: así no se reinicia sola la partida por
tener el dedo apoyado en el joystick.

En el celular conviene **"Agregar a pantalla de inicio"** desde el menú del
navegador: queda como una app, a pantalla completa.

## Ranking del equipo

Al terminar una partida, el puntaje viaja a la planilla de la chacra y aparece
en el **Ranking**, con el mejor puntaje de cada jugador. El juego no pregunta
quién sos: como vive en el mismo dominio que
[MonAgric](https://martintrigo.github.io/MonAgric/), lee de ahí el nombre y la
chacra que ya elegiste.

Si se abre suelto, sin MonAgric configurado, funciona igual y guarda el récord
de ese teléfono.

Los puntajes van a la hoja `Puntajes` de la planilla de cada chacra, así que
cada proyecto tiene su propia tabla.

## Cómo está hecho

HTML, CSS y JavaScript sin librerías ni dependencias. Todo se dibuja en un
lienzo de 224×288 píxeles que después se agranda a la pantalla, así que el
pixel art se mantiene nítido. Los dibujos no son imágenes: se generan por
código a partir de mapas de píxeles, y el cosechador se calcula redondeando un
círculo al que se le recorta la boca y se le apoya el sombrero encima.

| Archivo | Qué tiene |
|---|---|
| `index.html` | la pantalla, el joystick y los botones |
| `estilo.css` | los colores y la rueda del celular |
| `juego.js` | el laberinto, los dibujos, la inteligencia de las plagas y el bucle del juego |

## Para sumarlo a MonAgric

La carpeta es autónoma: se puede copiar entera dentro de `docs/juego/` del
repositorio [MonAgric](https://github.com/MartinTrigo/MonAgric) y queda
disponible en `.../MonAgric/juego/`, sin tocar nada de la aplicación.
