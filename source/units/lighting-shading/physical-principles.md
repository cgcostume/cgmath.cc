### Physikalische Grundlagen

*Für eine detailliertere Einführung in die physikalischen Grundlagen des Lichts empfehlen wir die Seite von [Bartosz Ciechanowski](https://ciechanow.ski/lights-and-shadows/). Für diese Einheit werden wir jedoch ein einfaches **Strahlenmodell** annehmen.*

Wir nehmen die Welt um uns darüber wahr, wie Licht mit ihr interagiert. Wir können Objekte nur sehen, wenn sie mit Licht in Kontakt kommen und dieses entweder in Richtung Betrachter*in zurückwerfen (**Reflexion**), durchlassen (**Transmission**) oder verschlucken (**Absorption**). Diese Erscheinungen nehmen Einfluss darauf, wie hell oder dunkel ein Objekt wahrgenommen wird, und bewirken dadurch Schattierung und Schattenwurf. Damit bilden sie auch die Grundlage für unser Beleuchtungsmodell.

Alle Bestandteile dieses Modells sind im folgenden beispielhaft illustriert.

| ![camera-model](./ray_types.png?as=webp) |
| :--------------: |
<!-- | Strahlentypen | -->


Weitere Phänomene, die bei der Interaktion von Licht mit Objekten einer Szene auftreten können, sind z.B. Lichtbeugung und -brechung sowie Interferenzerscheinungen -- diese spielen jedoch in den Lichtausbreitungsmodellen der Computergrafik in der Regel eine untergeordnete Rolle. Den Hauptfaktor bildet die **Reflexion**.

Im Folgenden werden wir die Intuition hinter den Hauptbestandteilen des **Phong-Beleuchtungsmodells**  erarbeiten.

### Reflexion

Wie bereits erwähnt unterscheiden wir zwischen **diffuser** und **spekularer** Reflexion, die zusammen unser (sehr simples) Beleuchtungsmodell bilden.
Welche physikalischen Grundlagen bzw. welche Modellannahmen stecken dahinter?

#### Diffuse Reflexion
Als diffuse Reflexion wird der Effekt bezeichnet, dass Flächen heller wirken, je mehr sie dem Licht zugewandt sind.
Sie ist vollständig unabhängig vom Betrachtungswinkel und nur von Oberflächenausrichtung und Lichtposition bzw. Lichtrichtung abhängig.

Es steht die Modellannahme dahinter, dass das auf die Oberfläche auftreffende Licht gleichmäßig in alle Richtungen reflektiert wird. Dieses Phänomen ist stärker, je rauer die Oberfläche ist. 

| ![camera-model](./diffuse.png?as=webp) |
| :--------------: |
| Diffuse Reflexion - modelliertes Verhalten |

Physikalisch lässt sich dieses Phänomen damit begründen, dass raue Flächen viele kleine Unebenheiten beinhalten. Wir können uns die Wirkung einer Lichtquelle als viele dicht nebeneinanderliegende Lichtstrahlen vorstellen. Treffen diese auf die Fläche, werden sie in praktisch zufällige Richtungen reflektiert. Durch dieses Verhalten der einzelnen Lichtstrahlen wird das Licht insgesamt annähernd gleichmäßig (isotrop) in alle verschiedenen Richtungen reflektiert.

| ![camera-model](./diffuse_zoom.png?as=webp) |
| :--------------: |
| Reflexion an Unebenheiten in der Oberfläche |

Wie viel Licht genau in Abhängigkeit vom Lichteinfallswinkel reflektiert wird, lässt sich mithilfe des **Lambertschen Gesetzes** berechnen.
Dieses besagt, dass die reflektierte Lichtmenge, also die Lichtintensität $I$, proportional zum Kosinus des Winkels zwischen der Einfallsrichtung des Lichtes und der Flächennormale ist. Dafür verwenden wir die **technische Lichtrichtung $\tilde{L}$**, die von der Oberfläche zur Lichtquelle verläuft (statt von der Lichtquelle zur Oberfläche), um korrekt mithilfe des Skalarprodukts den eingeschlossenen Winkel berechnen zu können.
<!-- Es ist zur besseren Berechenbarkeit so modelliert, dass die Richtung $L$ der invertierten Lichtrichtung entspricht. -->

| ![camera-model](./lambert.png?as=webp)|
| :--------------: |
| Lambertsches Gesetz |

Dieser Zusammenhang lässt sich auch aus folgender Überlegung über das Strahlenmodell herleiten. Wir können uns das Licht als ein Bündel paralleler Lichtstrahlen mit gleichem Abstand vorstellen. Je größer der Winkel der Lichtstrahlen zur Flächennormale ist, umso größer ist der Abstand, mit dem die Lichtstrahlen auf der Oberfläche aufkommen. Die gleiche Fläche wird also bei einem größeren Winkel von weniger Lichtstrahlen getroffen.
<div align="center">
    <canvas class="zdog-canvas" id="zdog-canvas" width="760" height="340"></canvas>
</div>

<div align="center">
    <img alt="Nach links und rechts ziehen, um Winkel zu ändern" src="./drag.png" height="50"/>
</div>
<br/>

Mit dieser Intuition können wir nun auch die Abhängigkeit vom Skalarprodukt zwischen Lichtrichtung und Normale erklären:
| ![camera-model](./lambert_explanation.png?as=webp)|
| :--------------: |

Je größer der Abstand $d$ der auftreffenden Lichtstrahlen auf der Oberfläche ist, umso schwächer ist die reflektierte Lichtintensität. Dadurch gilt $$
I\sim \frac{1}{d}.
$$
Diesen Abstand $d$ wiederum können wir in Abhängigkeit des Winkels zwischen Oberflächennormale und (technischer) Lichtrichtung beschreiben. Dafür können wir wie in der obigen Skizze eingezeichnet die Zusammenhänge am rechtwinkligen Dreieck nutzen und erhalten
$$
\cos(\alpha) = \frac{k}{d}.
$$
Dabei bezeichnet $k$ den konstanten kürzesten Abstand der Lichtstrahlen zueinander. Aus dieser Gleichung können wir
$$
d = \frac{k}{\cos(\alpha)}
$$
ableiten, wodurch wir den Zusammenhang $d\sim \frac{1}{\cos(\alpha)}$ und damit $I\sim \cos(\alpha)$ erhalten. Dieser Kosinus lässt sich mithilfe des Skalarprodukts beschreiben, womit wir den gesuchten Zusammenhang
$$
I\sim\langle N, \tilde{L}\rangle
$$
erhalten.

Damit können wir also die Abhängigkeit der diffusen Reflexion von sowohl der Oberflächenbeschaffenheit als auch von der Lichtrichtung begründen.

#### Spekulare Reflexion
| ![camera-model](./specular.png?as=webp) |
| :--------------: |
| Spekulare Reflexion -- modelliertes Verhalten |

Im Gegensatz zur Diffusen Reflexion ist die Spekulare Reflexion (auch *spiegelnde Reflexion* oder *Spiegellicht*) nicht nur von der Oberflächenbeschaffenheit und Lichtrichtung, sondern auch der Blickrichtung abhängig.

Hier ist die Modellannahme, dass sich das Licht (im Gegensatz zur gleichmäßigen diffusen Reflexion) ungleichmäßig und besonders konzentriert in eine Richtung $R$ spiegelt. Daraus ergibt sich auch die Abhängigkeit von der Blickrichtung: Der Punkt erscheint umso heller, je ähnlicher Blick- und Spiegelrichtung sind.

Spekulare Reflexion ist stärker auf sehr glatten (z.B. polierten) Oberflächen. Die Oberflächenbeschaffenheit bestimmt dabei sowohl, wie stark die spekulare Reflexion ist, als auch wie schnell die Helligkeit mit zunehmender Abweichung zwischen Blick- und Spiegelrichtung abnimmt.

| ![camera-model](./specular_formula.png?as=webp) |
| :--------------: |
| Spekulare Reflexion |

Sei $\alpha$ der Winkel zwischen Blick-und Reflexionsrichtung. Dann ist in dem hier betrachteten Modell die Intensität der Spekularen Reflexion proportional zu $cos^n \alpha$, wobei $n$ materialspezifisch ist.

| ![camera-model](./specular_formula2.png?as=webp) |
| :--------------: |
| Berechnung der Spiegelrichtung|

Die Spiegelrichtung $R$ liegt in einer Ebene mit $\tilde{L}$ und $N$. Außerdem ist der Winkel zwischen $\tilde{L}$ und $N$ identisch zu dem Winkel zwischen $N$ und $R$. Mit diesen Informationen können wir eine Berechnungformel für die Spiegelrichtung herleiten:

Sei $P$ die auf die Normale $N$ projizierte Lichtrichtung $\tilde{L}$. Dann entspricht der Vektor $S$ aus der folgenden Darstellung der Differenz aus $P$ und $\tilde{L}$. $$S = -\tilde{L} + P = P - \tilde{L} $$

Wie auch in der Abbildung gut erkennbar ist, entspricht der Reflexionsvektor $R$ der Summe aus der technischen Lichtrichtung $\tilde{L}$ und zwei Mal $S$.
$$R = \tilde{L} + 2\cdot S$$
Damit gilt $$R = \tilde{L} + 2\cdot (P-\tilde{L}) = 2\cdot P - \tilde{L}.$$
Der Vektor $P$ lässt sich wiederum durch Projektion von $\tilde{L}$ auf $N$ bestimmen.
Den Kosinus von Theta können wir dabei mit dem Skalarprodukt aus $N$ und $\tilde{L}$ bestimmen.
$$P = N\cdot \cos \theta = N \cdot \langle N, \tilde{L}\rangle$$
Wir erhalten also als Formel für die Reflexionsrichtung $$R = 2\cdot(N\cdot\langle N, \tilde{L}\rangle) - \tilde{L} $$
