import PublicLayout from "@/components/PublicLayout";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <PublicLayout>
        <section className="intro">
          <h1>¿Necesitas Consumibles?</h1>
          <h3>Por la compra de nuestros consumibles te damos asesoría telefonica técnica gratuita en corte plasma y mesas CNC</h3>
          <br />
          <img src="/img/consumibles.jpg" alt="Cero Multas" />
        </section>

        <section className="content normal">
          <div>
            <div>
              <h2>El mejor servicio</h2>
              <p>
                Después de muchos años trabajando en la industria metalmecánica con equipos y mesas de corte plasma, consideramos que somos los mejores asesorando a nuestros clientes. Además, tenemos claro que si nuestros clientes crecen, nosotros creceremos con ellos.
              </p>
              <p>
                Conociendo la industria, sabemos que hoy, muchos operarios a pesar de tener los mejores equipos de corte plasma, no cortan de manera adecuada perdiendo dinero en el proceso de corte. Por lo anterior, hemos tomado la decisión de ofrecer el servicio de asesoría técnica telefónica gratuita a nuestros clientes de consumibles.
              </p>

              <Link href="/catalogo" className="cuadrolink">
                <div className="cuadrodentro">¡Ver catálogo!</div>
              </Link>
            </div>
          </div>
          <div>
            <div className="img-container">
              <img src="/img/image.jpg" alt="ahorro" />
            </div>
          </div>
        </section>

        <section className="content reverse">
          <div>
            <div className="img-container">
              <img src="/img/corteaguapro.jpg" alt="ahorro" />
            </div>
          </div>
          <div>
            <div>
              <h2>Alíate con los Expertos</h2>
              <h4>La experiencia y la capacitación nos ha formado</h4>
              <p>
                Somos expertos, capacitados directamente por Hypertherm en máquinas Powermax y MaxPro200. Nos capacitamos en la sede de Hypertherm de Guarulhos - Brasil. Construimos las mesas de corte Practicut y conocemos qué es lo mejor según tu industria y línea de producción.
              </p>
              <p>
                Recuerda que el proceso de corte plasma es más económico que el corte con oxígeno solo si se utiliza de manera adecuada. Capacitamos a tu personal para que no cometa errores y corte de forma óptima evitando sobrecostos en la producción.
              </p>

              <Link href="/catalogo" className="cuadrolink">
                <div className="cuadrodentro">¡Ver catálogo!</div>
              </Link>
            </div>
          </div>
        </section>
    </PublicLayout>
  );
}
