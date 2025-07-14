@@ -0,0 +1,36 @@
#!/bin/sh

# This will search the git workflows for references to github repositories and fetch the latest tag information
# and edit the files with the correct sha version, commenting with the tag name.

# To run this, you will need to create a personal access token in github and pass it as the env variable `GITHUB_TOKEN`

if [ -z "$GITHUB_TOKEN" ]
then
  echo "\$GITHUB_TOKEN is not defined."
  exit 1
fi

fileList=$(ls .github/workflows/*.yaml)

doRepo () {
	allTags=$(curl -s --request GET --url https://api.github.com/repos/$1/tags --header "Authorization: Bearer ${GITHUB_TOKEN}" --header "X-GitHub-Api-Version: 2022-11-28" | jq -r '.[0]')
	tagName=$(jq -r '.name' <<< "$allTags")
	tagSha=$(jq -r '.commit.sha' <<< "$allTags")
	echo "${1}@${tagSha} # ${tagName}"
}

for fileName in $fileList; do
  echo "Updating $fileName"
  repos=`grep uses ${fileName} | sed 's/.*uses: *//' | awk -F '@' '{print $1}'`

  for repo in  $repos; do
    repoString=$(doRepo $repo)
    repoEscaped=$(sed 's/[/]/\\\//g' <<<"$repo")
    repoStringEscaped=$(sed 's/[/]/\\\//g' <<<"$repoString")
    # Differences in BSD and GNU sed mean it's easier to create backups and delete them later
    sed -i.bak "s/${repoEscaped}.*/${repoStringEscaped}/g" "./$fileName"
  done
done

rm .github/workflows/*.bak