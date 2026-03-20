"""
Public profile data fetchers.

Each platform fetch is isolated and resilient: errors return a structured
"unavailable" status instead of raising, so candidate flow is never blocked.
"""

import re
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from typing import Any, Dict
from urllib.parse import urlparse

import requests


class ProfileFetcher:
    """Fetch coding profile summaries from public sources."""

    def __init__(self, timeout_seconds: int = 5):
        self.timeout = timeout_seconds

    @staticmethod
    def _make_result(platform: str, url: str, username: str = "") -> Dict[str, Any]:
        return {
            "platform": platform,
            "url": url,
            "username": username,
            "status": "data_unavailable",
            "summary": {},
            "message": "Public data unavailable",
            "fetched_at": datetime.utcnow().isoformat(),
        }

    @staticmethod
    def _extract_username(url: str, expected_domain: str) -> str:
        if not url:
            return ""
        parsed = urlparse(url)
        path_parts = [part for part in parsed.path.split("/") if part]
        if expected_domain == "codechef.com" and len(path_parts) >= 2 and path_parts[0].lower() == "users":
            return path_parts[1]
        if path_parts:
            return path_parts[-1]
        return ""

    def fetch_github(self, url: str) -> Dict[str, Any]:
        result = self._make_result("github", url, self._extract_username(url, "github.com"))
        username = result["username"]
        if not username:
            result["message"] = "Invalid GitHub URL"
            return result

        try:
            user_resp = requests.get(f"https://api.github.com/users/{username}", timeout=self.timeout)
            if user_resp.status_code != 200:
                result["message"] = f"GitHub API returned {user_resp.status_code}"
                return result

            user_data = user_resp.json()
            repos_resp = requests.get(
                f"https://api.github.com/users/{username}/repos?per_page=100&sort=updated",
                timeout=self.timeout,
            )
            repos_data = repos_resp.json() if repos_resp.status_code == 200 else []
            lang_counter = Counter(
                [repo.get("language") for repo in repos_data if repo.get("language")]
            )

            result.update(
                {
                    "status": "ok",
                    "message": "Fetched successfully",
                    "summary": {
                        "profile_url": user_data.get("html_url", url),
                        "public_repos": user_data.get("public_repos", 0),
                        "followers": user_data.get("followers", 0),
                        "following": user_data.get("following", 0),
                        "top_languages": [lang for lang, _ in lang_counter.most_common(5)],
                    },
                }
            )
        except Exception as exc:
            result["message"] = f"Failed to fetch GitHub data: {exc}"

        return result

    def fetch_codeforces(self, url: str) -> Dict[str, Any]:
        result = self._make_result("codeforces", url, self._extract_username(url, "codeforces.com"))
        handle = result["username"]
        if not handle:
            result["message"] = "Invalid Codeforces URL"
            return result

        try:
            info_resp = requests.get(
                "https://codeforces.com/api/user.info",
                params={"handles": handle},
                timeout=self.timeout,
            )
            rating_resp = requests.get(
                "https://codeforces.com/api/user.rating",
                params={"handle": handle},
                timeout=self.timeout,
            )

            if info_resp.status_code != 200:
                result["message"] = f"Codeforces API returned {info_resp.status_code}"
                return result

            info_json = info_resp.json()
            if info_json.get("status") != "OK" or not info_json.get("result"):
                result["message"] = "Codeforces profile not found"
                return result

            info = info_json["result"][0]
            ratings = rating_resp.json().get("result", []) if rating_resp.status_code == 200 else []

            result.update(
                {
                    "status": "ok",
                    "message": "Fetched successfully",
                    "summary": {
                        "profile_url": f"https://codeforces.com/profile/{handle}",
                        "rating": info.get("rating"),
                        "max_rating": info.get("maxRating"),
                        "rank": info.get("rank"),
                        "max_rank": info.get("maxRank"),
                        "contest_count": len(ratings),
                        "last_contest_change": ratings[-1].get("newRating") if ratings else None,
                    },
                }
            )
        except Exception as exc:
            result["message"] = f"Failed to fetch Codeforces data: {exc}"

        return result

    def fetch_leetcode(self, url: str) -> Dict[str, Any]:
        result = self._make_result("leetcode", url, self._extract_username(url, "leetcode.com"))
        username = result["username"]
        if not username:
            result["message"] = "Invalid LeetCode URL"
            return result

        query = """
        query userPublicProfile($username: String!) {
          matchedUser(username: $username) {
            username
            profile {
              ranking
              reputation
            }
            submitStats {
              acSubmissionNum {
                difficulty
                count
              }
            }
          }
        }
        """

        try:
            resp = requests.post(
                "https://leetcode.com/graphql",
                json={"query": query, "variables": {"username": username}},
                headers={"Content-Type": "application/json", "Referer": "https://leetcode.com"},
                timeout=self.timeout,
            )
            if resp.status_code != 200:
                result["message"] = f"LeetCode endpoint returned {resp.status_code}"
                return result

            payload = resp.json()
            user = (payload.get("data") or {}).get("matchedUser")
            if not user:
                result["message"] = "LeetCode public stats unavailable"
                return result

            solved_total = 0
            by_difficulty = {}
            for entry in (user.get("submitStats") or {}).get("acSubmissionNum", []):
                difficulty = (entry.get("difficulty") or "").lower()
                count = entry.get("count", 0)
                if difficulty == "all":
                    solved_total = count
                else:
                    by_difficulty[difficulty] = count

            result.update(
                {
                    "status": "ok",
                    "message": "Fetched successfully",
                    "summary": {
                        "profile_url": f"https://leetcode.com/{username}/",
                        "ranking": ((user.get("profile") or {}).get("ranking")),
                        "reputation": ((user.get("profile") or {}).get("reputation")),
                        "problems_solved": solved_total,
                        "difficulty_breakdown": by_difficulty,
                    },
                }
            )
        except Exception as exc:
            result["message"] = f"Failed to fetch LeetCode data: {exc}"

        return result

    def fetch_codechef(self, url: str) -> Dict[str, Any]:
        result = self._make_result("codechef", url, self._extract_username(url, "codechef.com"))
        username = result["username"]
        if not username:
            result["message"] = "Invalid CodeChef URL"
            return result

        try:
            resp = requests.get(f"https://www.codechef.com/users/{username}", timeout=self.timeout)
            if resp.status_code != 200:
                result["message"] = f"CodeChef endpoint returned {resp.status_code}"
                return result

            text = resp.text
            rating_match = re.search(r"<strong>(\d{3,5})</strong>", text)
            stars_match = re.search(r"rating-star\s*>\s*([^<\s]+)", text)

            if not rating_match and not stars_match:
                result["message"] = "CodeChef stats unavailable"
                return result

            result.update(
                {
                    "status": "ok",
                    "message": "Fetched partially",
                    "summary": {
                        "profile_url": f"https://www.codechef.com/users/{username}",
                        "rating": int(rating_match.group(1)) if rating_match else None,
                        "stars": stars_match.group(1) if stars_match else None,
                    },
                }
            )
        except Exception as exc:
            result["message"] = f"Failed to fetch CodeChef data: {exc}"

        return result

    def fetch_all(self, links: Dict[str, str]) -> Dict[str, Dict[str, Any]]:
        tasks = []
        results: Dict[str, Dict[str, Any]] = {}
        with ThreadPoolExecutor(max_workers=4) as executor:
            if links.get("github"):
                tasks.append(("github", executor.submit(self.fetch_github, links["github"])))
            if links.get("leetcode"):
                tasks.append(("leetcode", executor.submit(self.fetch_leetcode, links["leetcode"])))
            if links.get("codeforces"):
                tasks.append(("codeforces", executor.submit(self.fetch_codeforces, links["codeforces"])))
            if links.get("codechef"):
                tasks.append(("codechef", executor.submit(self.fetch_codechef, links["codechef"])))

            for platform, future in tasks:
                try:
                    results[platform] = future.result(timeout=self.timeout + 2)
                except Exception as exc:
                    fallback = self._make_result(platform, links.get(platform, ""))
                    fallback["message"] = f"Data unavailable: {exc}"
                    results[platform] = fallback

        for platform in ("github", "leetcode", "codeforces", "codechef"):
            if platform not in results:
                results[platform] = self._make_result(platform, links.get(platform, ""))
                if not links.get(platform):
                    results[platform]["message"] = "Link not provided"
        return results
