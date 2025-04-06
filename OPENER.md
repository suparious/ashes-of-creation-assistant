# Opening Instructions for Claude

You're assisting with the MyAshes.ai project, an AI-powered assistant application for the MMORPG "Ashes of Creation." This project combines game data with AI capabilities to enhance player experience through various features.

## Using the CONTINUE.md File

First, read the CONTINUE.md file to understand the project architecture and implementation details:

```
read_file("C:/Users/shaun/repos/ashes-of-creation-assistant/CONTINUE.md")
```

This document contains comprehensive technical details about:
- Project architecture (Frontend, Backend, Data Pipeline, Infrastructure)
- Docker environment configuration
- Component structures
- Database schema
- Implementation status
- Dependencies
- Development workflow

Use this as your primary reference when answering questions or implementing features.

## Available MCP Tools

You have access to several Multi-Context Protocol (MCP) tools that enhance your capabilities:

### 1. Filesystem Access

You can directly access and manipulate files in the project:

- **Reading files**: 
  ```
  read_file("C:/Users/shaun/repos/ashes-of-creation-assistant/path/to/file")
  ```

- **Writing files**: 
  ```
  write_file("C:/Users/shaun/repos/ashes-of-creation-assistant/path/to/file", "content")
  ```

- **Editing files**: 
  ```
  edit_file("C:/Users/shaun/repos/ashes-of-creation-assistant/path/to/file", [{"oldText": "text to replace", "newText": "replacement text"}])
  ```

- **Listing directories**: 
  ```
  list_directory("C:/Users/shaun/repos/ashes-of-creation-assistant/path/to/directory")
  ```

- **Searching files**: 
  ```
  search_files("C:/Users/shaun/repos/ashes-of-creation-assistant", "pattern")
  ```

### 2. Web Search

Use Brave Search to find relevant information about Ashes of Creation or technical documentation:

```
brave_web_search({"query": "Ashes of Creation combat system"})
```

### 3. Fetch

Retrieve content from web URLs when you need external information:

```
fetch({"url": "https://example.com/some-documentation"})
```

### 4. Puppeteer

Automate browser interactions when necessary:

```
puppeteer_navigate({"url": "https://ashesofcreation.wiki"})
puppeteer_screenshot({"name": "wiki-homepage", "selector": "body"})
```

### 5. REPL/Analysis Tool

Execute JavaScript code for data analysis or processing:

```
repl({"code": "console.log('Analyzing data...'); // Analysis code here"})
```

## Best Practices for This Project

1. **Always examine existing code** before making changes to understand patterns and conventions
2. **Check dependencies** to ensure compatibility when adding new features
3. **Follow the established architecture** - don't mix concerns between layers
4. **Use Docker** for testing changes in an isolated environment
5. **Consider vector search** when implementing AI-powered features
6. **Be explicit about which files you're examining** to provide context for your responses

## When Working on Features

1. First **explore relevant existing files** to understand the current implementation
2. **Explain your approach** before making significant changes
3. **Implement changes incrementally** using the filesystem tools
4. **Verify compatibility** with the Docker environment
5. **Document any new components** you create

Your primary goal is to help implement and improve the MyAshes.ai assistant while following the established architecture and patterns. Always work toward creating functional, production-ready code that integrates well with the existing system.
