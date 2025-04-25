// Note: While we import the same module, the WASM is already cached by the browser
import init, { do_compute_dlog } from '../wasm/babygiant/babygiant.js';


self.onmessage = async (event) => {
    const { wasmPath, input } = event.data;
    const { Cx, Cy, min_range, max_range } = input;

    try {
        // This will use the browser's cache instead of re-downloading
        await init(wasmPath);

        const result = do_compute_dlog(Cx, Cy, BigInt(min_range), BigInt(max_range));
        // Send result back
        self.postMessage({
            status: 'success',
            result
        });
    } catch (error) {
        console.log("error", error); s
        self.postMessage({
            status: 'error',
            error: "dl_not_found"
        });
    }
};