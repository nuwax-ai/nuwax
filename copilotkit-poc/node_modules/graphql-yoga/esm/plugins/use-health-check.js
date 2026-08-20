export function useHealthCheck({ id = Date.now().toString(), logger = console, endpoint = '/health', } = {}) {
    return {
        onRequest({ endResponse, fetchAPI, request }) {
            if (request.url.endsWith(endpoint)) {
                logger.debug('Responding Health Check');
                const response = new fetchAPI.Response(null, {
                    status: 200,
                    headers: {
                        'x-yoga-id': id,
                    },
                });
                endResponse(response);
            }
        },
    };
}
