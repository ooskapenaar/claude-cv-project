# Security Guidelines

## Infrastructure Security

### Path Security ✅
- **No hardcoded absolute paths**: All configurations use dynamic path detection
- **Template-based config**: `claude_desktop_config.template.json` with `{{PROJECT_ROOT}}` placeholders
- **Generated configs ignored**: Actual configs with absolute paths are gitignored
- **Relative path detection**: Services use `process.cwd()` and `__dirname` for path resolution

### Setup Process
1. **Template system**: Keep `conf/claude_desktop_config.template.json` in git
2. **Dynamic generation**: Run `bin/setup-claude-config.sh` to generate actual config
3. **Local only**: Generated `conf/claude_desktop_config.json` is gitignored
4. **No secrets in git**: Infrastructure paths never committed

### Environment Variables
- `CV_PROJECT_ROOT`: Optional override for project root (defaults to `process.cwd()`)
- No other environment variables contain sensitive paths

## Data Security

### Userland Data Separation
- **Data directory**: Contains user-specific CVs, job data, matrices
- **Symlink architecture**: `data/` can be symlinked to external storage
- **Template ready**: Project structure supports multiple users

### Private Data Classification
- **Infrastructure private**: Paths, IP addresses, passwords (❌ NEVER in git)
- **Userland private**: CV content, personal info (📁 Data directory only)

## Best Practices

### For Developers
- Use `bin/setup-claude-config.sh` to generate configs locally
- Never commit absolute paths or personal data outside `data/` directory
- Test with different project locations to ensure portability

### For Users
- Keep userland data in `data/` directory or external symlinked location  
- Use template system for deployment to different machines
- Run setup script after cloning or moving project

## Security Checklist

- [ ] No hardcoded `/Users/username/` paths in source code
- [ ] No hardcoded `/home/username/` paths in source code  
- [ ] Template configs use `{{PROJECT_ROOT}}` placeholder
- [ ] Generated configs are gitignored
- [ ] Services work from any directory location
- [ ] Setup script generates configs dynamically
- [ ] No personal data in git (outside data/ directory)