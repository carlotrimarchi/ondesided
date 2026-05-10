# ondesided

**on·de·sid·ed** /ˌɒndɪˈsaɪdɪd/

*adjective*
1. *(of a person)*: unable to choose which side project to work on; having difficulty staying on top of an evergrowing list of side projects; starting new projects to avoid finishing others.
2. *(of a project)*: ignored, put aside, for a shinier one; perpetually in progress, never shipped; forgotten in the depth of a dev folder.

*noun*: a CLI tool to keep track of all your side projects

Never lose track of your side projects again. See which ones you've worked on most recently and which have been rotting away. Sort them, check path, branch, last commit, and their general abandonment status at a glance.

## Demo

https://github.com/user-attachments/assets/48c185c1-2dce-4b11-a07f-2c5055190b49

## Installation

```bash
npm install -g ondesided
```

## Usage

```bash
ondesided --dir <path> [options]
```

List all projects in ~/dev, sorted by most recently touched:

```bash
ondesided --dir ~/dev
```

Full details in a human-readable format:

```bash
ondesided --dir ~/dev --detail full --format pretty
```

Top 10 projects as JSON:

```bash
ondesided --dir ~/dev --detail simple --format json --limit 10
```

A dashboard to monitor projects:

https://github.com/user-attachments/assets/75caf797-2fb7-4713-8d27-24a7e8c3a8a7

*The demo features [wtfutil](https://wtfutil.com), [jq](https://jqlang.org), [figlet](http://www.figlet.org), and my own [nummerino](https://github.com/carlotrimarchi/nummerino).*

*Demos were made with [asciinema](https://asciinema.org) and [asciinema-automation](https://github.com/PierreMarchand20/asciinema_automation).*

## Options

| Option | Values | Default | Description |
|--------|--------|---------|-------------|
| `-d, --dir <path>` | any path | *(required)* | Directory to scan for projects |
| `-f, --format <type>` | `pretty`, `tsv`, `json` | `tsv` | Output format |
| `--detail <level>` | `path-only`, `minimal`, `simple`, `full` | `path-only` | How much info to show per project |
| `--sort <mode>` | `date`, `date-asc`, `name`, `name-desc` | `date` | Sort order |
| `--limit <number>` | positive integer | *(none)* | Cap the number of results |

### Detail levels

| Level | Fields shown |
|-------|-------------|
| `path-only` | path |
| `minimal` | name, path |
| `simple` | name, path, git repo flag, last commit date |
| `full` | name, path, git repo flag, branch, dirty flag, last commit message, last commit date |

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build
```

## License

MIT
