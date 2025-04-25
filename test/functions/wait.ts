export async function checkApiWithRetries<X>(get: () => Promise<X>, intervalInSeconds: number, maxNumberOfTrials: number, condition: (value: X) => boolean): Promise<boolean> {
    for (let i = 0; i < maxNumberOfTrials; i++) {
        console.log(`Attempt ${i + 1}`);
        const result = await get();
        console.log(`Result: ${JSON.stringify(result)}`);

        if (condition(result)) {
            console.log('Condition met');
            return true;
        }

        // Wait for y seconds before the next attempt
        console.log(`Waiting for ${intervalInSeconds} seconds`);
        await new Promise(resolve => setTimeout(resolve, intervalInSeconds * 1000));
    }
    return false;
}
