# Nord-Auto Markina · web de demostración

Web de demostración para un taller de chapa y pintura de Markina-Xemein (Bizkaia). En la portada, un coche en 3D se pinta mientras bajas: aparejo, enmascarado con papel, pintura en cabina y barniz, y al final eliges su color. Tiene además parte de daños interactivo: el cliente marca el tipo de golpe y la pieza sobre el plano del coche y el parte se envía por WhatsApp ya escrito.

**Verla publicada:** https://nordauto-markina.vercel.app/

## Cómo está hecha
- HTML, CSS y JavaScript propios, sin framework ni librerías externas
- Coche renderizado en Blender (EEVEE con trazado de rayos, corrección de color AgX): 120 fotogramas WebP dibujados en un canvas al ritmo del scroll, con etiquetas cuya posición sale de Blender fotograma a fotograma
- Selector de color con un render del coche por cada pintura
- Servicios en cartas apiladas, galería fijada que avanza de lado y visor a pantalla completa
- Antes y después con pasada de pistola, rótulo que corre con el scroll y cifras que suben solas
- Parte de daños sobre el plano del coche que acaba en WhatsApp
- Datos estructurados AutoBodyShop
- Alojada en Vercel

## Verla en local
```
python -m http.server 8000
```
y abre http://localhost:8000/

## Créditos
Modelo 3D del coche: "Car Concept" de Khronos Group ([glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets)), licencia [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), con materiales y animación propios.

## Sobre esta web
Diseño y desarrollo de [Dania360](https://dania360.com). Es una demo: los textos, las fotos y la marca del negocio pertenecen a sus dueños, y la web no se indexa en buscadores (`noindex`). El código se publica para enseñar cómo está hecha; no tiene licencia de uso.

Más webs en el portafolio: https://dania360-portafolio.vercel.app
