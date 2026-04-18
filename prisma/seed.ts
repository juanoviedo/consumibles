import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.product.createMany({
    data: [
      {
        codigo: '220930',
        nombre: 'Boquilla FineCut',
        precio: 20000,
        imagenUrl: '/img/finecut.png',
        descripcion1: 'Es fácil de reconocer porque su punta es circular. Esta boquilla puede utilizarse con 30 a 45 amperios...',
        descripcion2: 'La tecnología FineCut se utiliza para realizar cortes en espesores de lámina menores a 4 mm preferiblemente.',
      },
      {
        codigo: '220941',
        nombre: 'Boquilla 45A',
        precio: 20000,
        imagenUrl: '/img/boquilla45.png',
        descripcion1: 'La boquilla de 45 amperios es la más utilizada en la industria...',
        descripcion2: 'Si bien la boquilla puede cortar hasta 20 mm desde el borde...',
      },
      {
        codigo: '220819',
        nombre: 'Boquilla 65A',
        precio: 20000,
        imagenUrl: '/img/boquilla45.png',
        descripcion1: 'La boquilla de 65 amperios puede ser utilizada por los equipos Powermax 65, 85 y 105...',
        descripcion2: 'Si bien la boquilla puede cortar hasta 25 mm desde el borde...',
      },
      {
        codigo: '220816',
        nombre: 'Boquilla 85A',
        precio: 20000,
        imagenUrl: '/img/boquilla45.png',
        descripcion1: 'La boquilla de 85 amperios puede ser utilizada los equipos Powermax 85 y 105...',
        descripcion2: 'Si bien la boquilla puede cortar hasta 30 mm desde el borde...',
      },
      {
        codigo: '220990',
        nombre: 'Boquilla 105A',
        precio: 20000,
        imagenUrl: '/img/boquilla105.png',
        descripcion1: 'Tener siempre mucho cuidado con esta boquilla, pues al ser parecida a las otras se suele utilizar con los consumibles inadecuados.',
        descripcion2: 'La boquilla de 105 amperios puede ser utilizada por los equipos Powermax 105...',
      },
      {
        codigo: '220842',
        nombre: 'Electrodo 10 - 105A',
        precio: 28000,
        imagenUrl: '/img/electrode.png',
        descripcion1: 'El electrodo sirve para todos los amperajes de equipos Powermax...',
        descripcion2: 'El espesor de corte no depende del electrodo, solo de la boquilla...',
      },
      {
        codigo: '220818',
        nombre: 'Escudo de arrastre 15-85A',
        precio: 40000,
        imagenUrl: '/img/escudo.png',
        descripcion1: 'El escudo de arrastre se utiliza para cortes manuales. El escudo está diseñado para ser arrastrado...',
        descripcion2: 'Para realizar perforaciones en la lámina, se recomienda inclinar la antorcha un poco...',
      },
      {
        codigo: '220857',
        nombre: 'Anillo Difusor 10 - 105A',
        precio: 40000,
        imagenUrl: '/img/AnilloDifusor.png',
        descripcion1: 'Se encarga de centrar y distribuir uniformemente el flujo de gas alrededor del electrodo...',
        descripcion2: 'Para revisar el anillo 220857, verifica que los pequeños orificios laterales estén libres de obstrucciones...',
      }
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
