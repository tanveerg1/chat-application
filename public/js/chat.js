const socket = io();

//elements
const $form = document.querySelector('#message-form');
const $formInput = $form.querySelector('input');
const $formButton = $form.querySelector('button');
const $locationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const urlTemplate = document.querySelector('#url-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoScroll = () => {
    // new message element
    const $newMessage = $messages.lastElementChild;

    // height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    //visible height
    const visibleHeight = $messages.offsetHeight;

    //height of messages container
    const containerHeight = $messages.scrollHeight;

    // how far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset + 1) {
        $messages.scrollTop = $messages.scrollHeight;
    }
}

socket.on('message', (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

socket.on('locationMessage', (message) => {
    console.log(message);
    const html = Mustache.render(urlTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html;
});

$form.addEventListener('submit', (e) => {
    e.preventDefault();

    $formButton.setAttribute('disabled', 'disabled');

    const message = e.target.elements.message.value;

    socket.emit('sendMessage', message, (error) => {
        $formButton.removeAttribute('disabled');
        $formInput.value = '';
        $formInput.focus();
        
        if(error) {
            return console.log(error);
        }

        console.log('Message delivered!');
    });
});

$locationButton.addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.');
    }

    $locationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {

        const location = {
            long: position.coords.longitude,
            lat: position.coords.latitude
        }

        socket.emit('sendLocation', location, () => {
            $locationButton.removeAttribute('disabled');
            console.log('Location shared!');
        });

    });
});

socket.emit('join', { username, room }, (error) => {
    if(error) {
        alert(error);
        location.href = '/';
    }
});