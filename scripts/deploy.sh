#!/usr/bin/env bash
# Deploy Delta to Cloud Run. Builds the image with NEXT_PUBLIC_* baked in at
# build time (they are inlined into the client bundle, so a plain runtime
# --set-env-vars is NOT enough), pushes to Artifact Registry, then deploys.
#
# Prereqs (one-time, done by a human):
#   - gcloud authed; project set; billing enabled
#   - APIs: run, cloudbuild, artifactregistry, secretmanager, firestore, identitytoolkit
#   - Firestore Native DB created; Firebase Auth (Email/Password + Google) enabled
#   - Secret created:  echo -n "$GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=-
#   - Artifact Registry repo:  gcloud artifacts repositories create delta \
#                                --repository-format=docker --location=$REGION
#   - Runtime SA (least privilege):
#       gcloud iam service-accounts create delta-run
#       gcloud projects add-iam-policy-binding $PROJECT --member=serviceAccount:$SA \
#         --role=roles/datastore.user
#       gcloud secrets add-iam-policy-binding gemini-api-key --member=serviceAccount:$SA \
#         --role=roles/secretmanager.secretAccessor
set -euo pipefail

PROJECT="${PROJECT:-delta-499915}"
REGION="${REGION:-asia-south1}"      # Mumbai — closest to India users
SERVICE="${SERVICE:-delta}"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT}/delta/delta:latest"
SA="delta-run@${PROJECT}.iam.gserviceaccount.com"

: "${NEXT_PUBLIC_FIREBASE_API_KEY:?}"
: "${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:?}"
: "${NEXT_PUBLIC_FIREBASE_PROJECT_ID:?}"
: "${NEXT_PUBLIC_FIREBASE_APP_ID:?}"

# 1. Build + push (NEXT_PUBLIC_* baked in via build args; see cloudbuild.yaml).
gcloud builds submit --config cloudbuild.yaml --project "$PROJECT" --region "$REGION" \
  --substitutions="_IMAGE=${IMAGE},\
_FB_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY},\
_FB_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN},\
_FB_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID},\
_FB_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:-},\
_FB_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:-},\
_FB_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID}"

# 2. Deploy. GEMINI_API_KEY comes from Secret Manager; the server reaches
#    Firestore via ADC (the least-privilege delta-run SA). The model defaults
#    to gemini-2.5-flash in code (override with GEMINI_MODEL if needed).
gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --region "$REGION" \
  --project "$PROJECT" \
  --allow-unauthenticated \
  --min-instances 1 \
  --cpu 1 --memory 512Mi --port 8080 \
  --service-account "$SA" \
  --set-secrets "GEMINI_API_KEY=gemini-api-key:latest" \
  --set-env-vars "FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID}"

echo "Done. Add the printed Cloud Run domain to Firebase Auth > Settings >"
echo "Authorized domains so Google sign-in works (email/password works without it)."
