# EduX Frontend Docker Deployment

## 1. Purpose

This provides a production image for the existing EduX Vite frontend. It does not add or migrate a backend.

## 2. Architecture

`Node Build Stage → Vite Build → Nginx Runtime`

Dependencies are installed with the checked-in npm lockfile, the existing `npm run build` command creates `dist/`, and only that output is copied into the runtime image.

## 3. Files

- `Dockerfile` — multi-stage build and Nginx runtime image
- `nginx.conf` — SPA serving, caching, compression, and conservative headers
- `.dockerignore` — excludes local and build-only files from the build context

## 4. Build Command

```sh
docker build -t edux-frontend .
```

## 5. Run Command

```sh
docker run --rm -p 8080:80 --name edux-frontend edux-frontend
```

Choose any available host port; the container listens on port 80.

## 6. Port

Port `80` is exposed by the image. No host port is hardcoded.

## 7. SPA Routing

Nginx serves existing files directly and falls back to `/index.html` for other browser navigations. This supports direct loading and refreshes of React Router routes such as `/student`, `/faculty/my-students`, and `/admin`.

## 8. Environment Variables

Vite variables are build-time values. The existing `VITE_USE_MOCK` and `VITE_API_BASE_URL` mechanism is unchanged; provide values during the image build, for example with Docker build arguments or the build environment as appropriate for the deployment pipeline. No secrets or `.env` files are included.

The static Nginx container does not provide runtime injection of environment variables.

## 9. API Configuration

The application currently defaults to its existing configured API origin and supports `VITE_API_BASE_URL` for an alternate API origin when mock mode is disabled. No localhost URL or backend service was added. Production API routing is NOT CURRENTLY DEFINED by this frontend Docker configuration; deployment infrastructure must provide the intended API origin or reverse proxy.

## 10. Production Deployment Notes

Use a TLS-terminating ingress or load balancer in front of the container, map a deployment-selected host port to container port 80, and supply frontend build-time configuration through the deployment pipeline. Do not put credentials in Vite variables.

## 11. Validation

Validate the image with a temporary host port and HTTP requests to `/`, a representative client route, and a file under `/assets/`. Stop and remove temporary containers after testing.

## 12. Known Limitations

The existing shared frontend bundle is relatively large; bundle optimization was intentionally not performed. This image does not include a backend, API reverse proxy, or runtime environment-variable substitution. No health check is defined because the selected minimal Nginx image does not guarantee a health-check utility, and no extra dependency was added solely for that purpose.
