BUCKET_URI="s3://jobsite-static"
BUCKET_PATH='blam'
CLOUDFRONT_ID='ED1ZCNZBZX9SF'
aws s3 sync ./public $BUCKET_URI/$BUCKET_PATH
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths /$BUCKET_PATH/*
