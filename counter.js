(() => {
    const seed = 1729;
    const cpu = navigator.hardwareConcurrency || 6;
    const timeKey = Math.floor(Date.now() / 86400000) % 9;

    const viewCount = seed + (cpu * 11) + timeKey * 13;

    function formatK(num) {
        if (num >= 1000) {
            const k = (num / 1000).toFixed(1);
            return k.replace('.0','') + "k"; // removes .0 if exact
        }
        return num.toLocaleString("en-US");
    }

    const formatted = formatK(viewCount);
    document.getElementById("visitorCountNum").textContent = formatted;
})();
