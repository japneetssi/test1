async function run() {
  try {
    let baseTicker = "3MINDIA-EQ".replace(/-(EQ|BE|BZ|SM)$/i, '');
    console.log(baseTicker);
  } catch (err) {
    console.error("RUNTIME ERROR:", err);
  }
}
run();
