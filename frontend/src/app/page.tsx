import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 to-purple-100 text-gray-800">
      {/* Header */}
      <header className="w-full bg-white shadow-md p-4 flex justify-between items-center z-10">
        <div className="text-2xl font-bold text-blue-600 font-['RobloxFont']">
          Roblox Scam Detectie Centrum
        </div>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link href="#how-it-works" className="text-gray-600 hover:text-blue-600">
                Hoe het werkt
              </Link>
            </li>
            <li>
              <Link href="#features" className="text-gray-600 hover:text-blue-600">
                Functies
              </Link>
            </li>
            <li>
              <Link href="/login" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                Login
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative flex-grow flex items-center justify-center text-center p-8">
        <div className="absolute inset-0 bg-hero-pattern bg-cover bg-center opacity-20"></div> {/* Placeholder voor Roblox-achtige achtergrond */}
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold text-blue-700 leading-tight mb-4 animate-fade-in-down font-['RobloxFont']">
            Bescherm Jezelf Tegen Roblox Scams!
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-2xl mx-auto animate-fade-in-up">
            Meld, bekijk en bestrijd online oplichting op Roblox. Samen maken we Roblox veiliger voor iedereen.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in">
            <Link href="/report-scam" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transform hover:scale-105 transition-all duration-300">
              Meld een Scam
            </Link>
            <Link href="/scammer-list" className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transform hover:scale-105 transition-all duration-300">
              Bekijk Scammerlijst
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 bg-white text-center">
        <h2 className="text-4xl font-bold text-blue-600 mb-12 font-['RobloxFont']">Hoe werkt het?</h2>
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
          <div className="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
            <div className="text-5xl mb-4 text-blue-500">📝</div>
            <h3 className="text-2xl font-semibold mb-2">1. Meld een Scam</h3>
            <p className="text-gray-700">
              Vul ons eenvoudige formulier in met de details van de scam en voeg bewijsmateriaal toe.
            </p>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
            <div className="text-5xl mb-4 text-green-500">✅</div>
            <h3 className="text-2xl font-semibold mb-2">2. Wij Verifiëren</h3>
            <p className="text-gray-700">
              Ons team van experts controleert zorgvuldig elke melding. Bij goedkeuring belonen we je!
            </p>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
            <div className="text-5xl mb-4 text-purple-500">🔍</div>
            <h3 className="text-2xl font-semibold mb-2">3. Bescherm Anderen</h3>
            <p className="text-gray-700">
              De scammer wordt toegevoegd aan onze lijst, zodat andere spelers gewaarschuwd zijn.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-blue-50 text-center">
        <h2 className="text-4xl font-bold text-blue-600 mb-12 font-['RobloxFont']">Wat wij bieden</h2>
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
            <div className="text-4xl mb-4 text-blue-500">🛡️</div>
            <h3 className="text-xl font-semibold mb-2">Veiliger Roblox</h3>
            <p className="text-gray-700">Draag bij aan een veiligere omgeving voor alle Roblox-spelers.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
            <div className="text-4xl mb-4 text-green-500">🎁</div>
            <h3 className="text-xl font-semibold mb-2">Word Beloon</h3>
            <p className="text-gray-700">Verdien beloningen voor waardevolle en geverifieerde meldingen.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
            <div className="text-4xl mb-4 text-purple-500">📊</div>
            <h3 className="text-xl font-semibold mb-2">Transparante Lijst</h3>
            <p className="text-gray-700">Toegang tot een actuele lijst van bekende scammers.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
            <div className="text-4xl mb-4 text-red-500">🚫</div>
            <h3 className="text-xl font-semibold mb-2">Anonieme Meldingen</h3>
            <p className="text-gray-700">Meld scams anoniem om je privacy te beschermen.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-gray-800 text-white p-8 text-center mt-auto">
        <div className="container mx-auto">
          <p>&copy; {new Date().getFullYear()} Roblox Scam Detectie Centrum. Alle rechten voorbehouden.</p>
          <div className="flex justify-center space-x-4 mt-4">
            <Link href="/privacy" className="text-gray-400 hover:text-white">
              Privacybeleid
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white">
              Gebruiksvoorwaarden
            </Link>
            <Link href="/contact" className="text-gray-400 hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
