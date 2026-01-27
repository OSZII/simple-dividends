import type { Handle } from '@sveltejs/kit';
import cron from 'node-cron';

// This runs once when the server starts
cron.schedule('* * * * *', () => {
    console.log('Running a task every minute');
});


export const handle: Handle = async ({ event, resolve }) => {
    // if (event.url.pathname.startsWith('/custom')) {
    //     return new Response('custom response');
    // }

    const response = await resolve(event);
    return response;
};