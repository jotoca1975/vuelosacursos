
const supabaseUrl = "https://xiarahccciclooxagezc.supabase.co";
const supabaseKey = "sb_publishable_eobhXEKZnbdRgmuE42tKDA_mk34Dgh0";

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

async function cargarViajeros() {

    const { data, error } = await supabase
        .from("viajeros")
        .select("*");

    if (error) {
        console.error(error);
        return;
    }

    console.log("Conectado correctamente.");
    console.table(data);

}

cargarViajeros();
