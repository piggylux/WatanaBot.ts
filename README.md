<div align="center">Yousoro!~ (> ᴗ •)ゞ</div>
<br/>
<div align="center">
	<img src="https://raw.githubusercontent.com/Sylux6/WatanaBot.ts/main/src/assets/you.gif" alt="Watanabe You">
</div>

<br/>
<div align="right">made with 💖 in TypeScript</div>

## Get Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [bun](https://bun.sh/)
- [PostgreSQL](https://www.postgresql.org/)

### Configuration

Create a `config.json` file at the root of the project

```json
{
  "token": "discord bot token",
  "clientId": "discord bot client id"
}
```

Or set the `TOKEN` and `CLIENT_ID` environment variables instead.

The database connection is read from the `DATABASE_URL` environment variable, which can be set in a `.env` file at the root of the project

```
DATABASE_URL="postgresql://user:password@localhost:5432/database"
```

Then apply the database migrations

```sh
bunx prisma migrate deploy
```
