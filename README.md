# Koirameili
 
## Development

First off, create `.env` file from the `.example.env` and configure it appropriately. You'll need a MariaDB database, Discord bot token, and a domain for receiving mail.

Koirameili runs its own mail server on port 25. You can point your domain to your server using A or MX (or anything else that works) record.

Install required npm dependencies using:

```
$ npm install
```

After configuring the `.env` file and installing dependencies, you can run the app using:

```
$ npm run
```

### Making local development server reachable from the Internet

If you're testing by sending mail from a public online mail server, you'll realise that your server and DNS records must be accessible from the Internet in order to mails to deliver. 

You can try to make everything local and send mails locally, but I prefer to do it the "hard" way. I used SSH remote port forwarding, but anything like router port forwarding or a tunnel server would work.

To use SSH remote port forwarding you'll need to enable `GatewayPorts` and `AllowTcpForwarding` in the `/etc/ssh/sshd_config` on your public server. To begin forwarding, just connect to your remote server using your local machine as follows:

```
$ ssh -R 25:localhost:25 you@yourserver.com
```

You can't usually send mail directly to an IP address, therefore you'll need to set up DNS record for it. For developement purposes, A record is quick and easy to set up. Just point your domain to your server and you'll be able to send emails to `mailbox@yourserver.com`.
