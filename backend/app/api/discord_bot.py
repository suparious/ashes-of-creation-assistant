import os
import discord
from discord.ext import commands
from discord import app_commands
import asyncio
from loguru import logger
from typing import Dict, List, Any, Optional, Union, Tuple
import json
import uuid
from datetime import datetime
import re
from io import BytesIO
import emoji
from config import settings
from services.llm_service import LLMService
from services.vector_store import query_vector_store
from services.item_service import ItemService
from services.build_service import BuildService
from services.server_service import ServerService
from services.location_service import LocationService

# Initialize services
llm_service = LLMService()
item_service = ItemService()
build_service = BuildService()
server_service = ServerService()
location_service = LocationService()

class AshesAssistantBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        super().__init__(command_prefix=settings.DISCORD_COMMAND_PREFIX, intents=intents)
        
        # Chat session storage (user_id -> messages)
        self.chat_sessions: Dict[str, List[Dict[str, str]]] = {}
        
        # Pagination storage (message_id -> pagination_state)
        self.paginations: Dict[str, Dict[str, Any]] = {}
        
        # Command cooldowns (user_id -> {command: timestamp})
        self.cooldowns: Dict[str, Dict[str, float]] = {}
        
    async def setup_hook(self) -> None:
        # Register slash commands
        await self.register_commands()
        logger.info("Discord bot commands registered")
        
    async def register_commands(self):
        """Register slash commands with Discord."""
        # General commands
        ask_command = app_commands.Command(
            name="ask",
            description="Ask a question about Ashes of Creation",
            callback=self.ask_command
        )
        ask_command.add_option(
            app_commands.Option(
                name="question",
                description="Your question about Ashes of Creation",
                type=discord.AppCommandOptionType.string,
                required=True
            )
        )
        self.tree.add_command(ask_command)
        
        # Server commands
        server_command = app_commands.Command(
            name="server",
            description="Set your preferred game server for contextual queries",
            callback=self.server_command
        )
        server_command.add_option(
            app_commands.Option(
                name="name",
                description="Server name",
                type=discord.AppCommandOptionType.string,
                required=True,
                autocomplete=self.server_autocomplete
            )
        )
        self.tree.add_command(server_command)
        
        # Item commands
        item_command = app_commands.Command(
            name="item",
            description="Search and display item information",
            callback=self.item_command
        )
        item_command.add_option(
            app_commands.Option(
                name="name",
                description="Item name to search for",
                type=discord.AppCommandOptionType.string,
                required=True,
                autocomplete=self.item_autocomplete
            )
        )
        self.tree.add_command(item_command)
        
        # Build commands
        build_command = app_commands.Command(
            name="build",
            description="Search and display character builds",
            callback=self.build_command
        )
        build_command.add_option(
            app_commands.Option(
                name="query",
                description="Search query (e.g., 'tank mage build')",
                type=discord.AppCommandOptionType.string,
                required=True
            )
        )
        self.tree.add_command(build_command)
        
        # Map commands
        location_command = app_commands.Command(
            name="location",
            description="Get information about a location in Ashes of Creation",
            callback=self.location_command
        )
        location_command.add_option(
            app_commands.Option(
                name="name",
                description="Location name to search for",
                type=discord.AppCommandOptionType.string,
                required=True,
                autocomplete=self.location_autocomplete
            )
        )
        self.tree.add_command(location_command)
        
        # Resource commands
        resource_command = app_commands.Command(
            name="resource",
            description="Find where to gather a specific resource",
            callback=self.resource_command
        )
        resource_command.add_option(
            app_commands.Option(
                name="name",
                description="Resource name to search for",
                type=discord.AppCommandOptionType.string,
                required=True,
                autocomplete=self.resource_autocomplete
            )
        )
        self.tree.add_command(resource_command)
        
        # Crafting commands
        crafting_command = app_commands.Command(
            name="recipe",
            description="Look up a crafting recipe",
            callback=self.recipe_command
        )
        crafting_command.add_option(
            app_commands.Option(
                name="name",
                description="Recipe name to search for",
                type=discord.AppCommandOptionType.string,
                required=True,
                autocomplete=self.recipe_autocomplete
            )
        )
        self.tree.add_command(crafting_command)
        
        # Utility commands
        reset_command = app_commands.Command(
            name="reset",
            description="Reset your chat history with the assistant",
            callback=self.reset_command
        )
        self.tree.add_command(reset_command)
        
        help_command = app_commands.Command(
            name="help",
            description="Get help with using the Ashes Assistant bot",
            callback=self.help_command
        )
        self.tree.add_command(help_command)
        
        # Sync commands with Discord
        await self.tree.sync()
        
    async def on_ready(self):
        """Called when the bot is ready."""
        logger.info(f"Logged in as {self.user.name} ({self.user.id})")
        await self.change_presence(activity=discord.Activity(
            type=discord.ActivityType.listening,
            name="your Ashes of Creation questions | /help"
        ))
    
    #==========================
    # Autocomplete handlers
    #==========================
    
    async def server_autocomplete(self, interaction: discord.Interaction, current: str) -> List[app_commands.Choice[str]]:
        """Autocomplete for server names."""
        servers = await server_service.get_all_servers()
        filtered_servers = [s for s in servers if current.lower() in s['name'].lower()]
        return [
            app_commands.Choice(name=server['name'], value=server['id'])
            for server in filtered_servers[:25]  # Discord limits to 25 choices
        ]
    
    async def item_autocomplete(self, interaction: discord.Interaction, current: str) -> List[app_commands.Choice[str]]:
        """Autocomplete for item names."""
        if len(current) < 2:
            return []
            
        items = await item_service.search_items(current, limit=25)
        return [
            app_commands.Choice(name=item['name'], value=item['id'])
            for item in items
        ]
    
    async def location_autocomplete(self, interaction: discord.Interaction, current: str) -> List[app_commands.Choice[str]]:
        """Autocomplete for location names."""
        if len(current) < 2:
            return []
            
        locations = await location_service.search_locations(current, limit=25)
        return [
            app_commands.Choice(name=location['name'], value=location['id'])
            for location in locations
        ]
    
    async def resource_autocomplete(self, interaction: discord.Interaction, current: str) -> List[app_commands.Choice[str]]:
        """Autocomplete for resource names."""
        if len(current) < 2:
            return []
            
        resources = await item_service.search_resources(current, limit=25)
        return [
            app_commands.Choice(name=resource['name'], value=resource['id'])
            for resource in resources
        ]
    
    async def recipe_autocomplete(self, interaction: discord.Interaction, current: str) -> List[app_commands.Choice[str]]:
        """Autocomplete for recipe names."""
        if len(current) < 2:
            return []
            
        recipes = await item_service.search_recipes(current, limit=25)
        return [
            app_commands.Choice(name=recipe['name'], value=recipe['id'])
            for recipe in recipes
        ]
    
    #==========================
    # Command handlers
    #==========================
    
    async def ask_command(self, interaction: discord.Interaction, question: str):
        """Handle ask command to query the AI assistant."""
        if not await self._check_cooldown(interaction, "ask", 5):
            return
            
        # Defer the response since it might take some time
        await interaction.response.defer(thinking=True)
        
        # Get or create chat session for this user
        user_id = str(interaction.user.id)
        if user_id not in self.chat_sessions:
            self.chat_sessions[user_id] = []
            
        # Add user message to chat history
        self.chat_sessions[user_id].append({
            "role": "user",
            "content": question
        })
        
        try:
            # Get server context if any
            server_context = await self.get_user_server(user_id)
            
            # Get response from AI
            response_text, context_docs = await llm_service.get_chat_completion(
                messages=self.chat_sessions[user_id],
                query=question,
                server=server_context
            )
            
            # Add assistant response to chat history
            self.chat_sessions[user_id].append({
                "role": "assistant",
                "content": response_text
            })
            
            # Truncate history if it gets too long (keep most recent 20 messages)
            if len(self.chat_sessions[user_id]) > 20:
                self.chat_sessions[user_id] = self.chat_sessions[user_id][-20:]
            
            # Format response into chunks if needed (Discord has 2000 char limit)
            await self.send_formatted_response(interaction, question, response_text, context_docs)
            
        except Exception as e:
            logger.error(f"Error processing ask command: {e}")
            await interaction.followup.send("Sorry, I encountered an error processing your request. Please try again.")
    
    async def server_command(self, interaction: discord.Interaction, name: str):
        """Set the server context for a user."""
        if not await self._check_cooldown(interaction, "server", 2):
            return
            
        user_id = str(interaction.user.id)
        
        try:
            # Get server details
            server = await server_service.get_server(name)
            if not server:
                await interaction.response.send_message(
                    f"Server not found. Please use autocomplete to select a valid server.",
                    ephemeral=True
                )
                return
            
            # Store the server preference in Redis
            redis_key = f"discord:server:{user_id}"
            from services.cache_service import get_cache
            cache = await get_cache()
            await cache.set(redis_key, server['id'])
            
            # Create embed response
            embed = discord.Embed(
                title="Server Preference Set",
                description=f"Your server context has been set to **{server['name']}**.",
                color=discord.Color.green()
            )
            embed.add_field(name="Region", value=server.get('region', 'Unknown'), inline=True)
            embed.add_field(name="Status", value=server.get('status', 'Unknown'), inline=True)
            embed.set_footer(text="I'll use this context when answering server-specific questions.")
            
            await interaction.response.send_message(embed=embed, ephemeral=True)
            
        except Exception as e:
            logger.error(f"Error setting server context: {e}")
            await interaction.response.send_message(
                "There was an error setting your server context. Please try again later.",
                ephemeral=True
            )
    
    async def item_command(self, interaction: discord.Interaction, name: str):
        """Display detailed information about an item."""
        if not await self._check_cooldown(interaction, "item", 3):
            return
            
        await interaction.response.defer(thinking=True)
        
        try:
            # Get item details
            item = await item_service.get_item(name)
            if not item:
                await interaction.followup.send("Item not found. Please try a different search term.")
                return
            
            # Create embed for item
            embed = discord.Embed(
                title=item['name'],
                description=item.get('description', 'No description available.'),
                color=self._get_rarity_color(item.get('rarity', 'common'))
            )
            
            # Add image if available
            if 'image_url' in item and item['image_url']:
                embed.set_thumbnail(url=item['image_url'])
            
            # Add basic info
            embed.add_field(name="Type", value=item.get('type', 'Unknown'), inline=True)
            embed.add_field(name="Rarity", value=item.get('rarity', 'Common').capitalize(), inline=True)
            embed.add_field(name="Level", value=str(item.get('level', 'N/A')), inline=True)
            
            # Add stats if available
            if 'stats' in item and item['stats']:
                stats_text = ""
                for stat_name, value in item['stats'].items():
                    # Format stat name for readability
                    formatted_name = stat_name.replace('_', ' ').title()
                    stats_text += f"**{formatted_name}:** +{value}\n"
                embed.add_field(name="Stats", value=stats_text, inline=False)
            
            # Add effects if available
            if 'effects' in item and item['effects']:
                effects_text = ""
                for effect in item['effects']:
                    effects_text += f"**{effect.get('name', 'Effect')}:** {effect.get('description', 'No description')}\n"
                embed.add_field(name="Effects", value=effects_text, inline=False)
            
            # Add source information
            embed.add_field(name="Source", value=item.get('source', 'Unknown'), inline=False)
            
            # Add footer with retrieval info
            embed.set_footer(text=f"Item ID: {item['id']} • Use /recipe to see crafting details if applicable")
            
            # Create view with buttons
            view = discord.ui.View()
            
            # Add link to website item page if available
            website_url = f"{settings.WEBSITE_URL}/items/{item['id']}"
            view.add_item(discord.ui.Button(label="View on Website", url=website_url))
            
            # Add button to show similar items
            similar_button = discord.ui.Button(label="Similar Items", custom_id=f"similar:{item['id']}")
            similar_button.callback = self._create_similar_items_callback(item)
            view.add_item(similar_button)
            
            await interaction.followup.send(embed=embed, view=view)
            
        except Exception as e:
            logger.error(f"Error in item command: {e}")
            await interaction.followup.send("Sorry, I encountered an error retrieving item information.")
    
    async def build_command(self, interaction: discord.Interaction, query: str):
        """Search and display character builds."""
        if not await self._check_cooldown(interaction, "build", 3):
            return
            
        await interaction.response.defer(thinking=True)
        
        try:
            # Search for builds
            builds = await build_service.search_builds(query, limit=5)
            
            if not builds:
                await interaction.followup.send(
                    "No builds found matching your query. Try a different search term or check out popular builds with `/build popular`."
                )
                return
            
            # Create initial response with navigation
            embed = await self._create_build_embed(builds[0], 1, len(builds))
            
            # Create pagination view
            view = self._create_pagination_view(builds, self._create_build_embed)
            
            await interaction.followup.send(embed=embed, view=view)
            
        except Exception as e:
            logger.error(f"Error in build command: {e}")
            await interaction.followup.send("Sorry, I encountered an error retrieving builds.")
    
    async def location_command(self, interaction: discord.Interaction, name: str):
        """Display information about a location."""
        if not await self._check_cooldown(interaction, "location", 3):
            return
            
        await interaction.response.defer(thinking=True)
        
        try:
            # Get location details
            location = await location_service.get_location(name)
            if not location:
                await interaction.followup.send("Location not found. Please try a different search term.")
                return
            
            # Create embed for location
            embed = discord.Embed(
                title=location['name'],
                description=location.get('description', 'No description available.'),
                color=discord.Color.blue()
            )
            
            # Add image if available
            if 'image_url' in location and location['image_url']:
                embed.set_image(url=location['image_url'])
            
            # Add basic info
            embed.add_field(name="Type", value=location.get('type', 'Unknown'), inline=True)
            embed.add_field(name="Region", value=location.get('region', 'Unknown'), inline=True)
            embed.add_field(name="Level Range", value=location.get('level_range', 'N/A'), inline=True)
            
            # Add points of interest if available
            if 'points_of_interest' in location and location['points_of_interest']:
                poi_text = ""
                for poi in location['points_of_interest'][:5]:  # Limit to 5 to avoid too long embed
                    poi_text += f"• {poi['name']}: {poi.get('description', 'No description')}\n"
                embed.add_field(name="Points of Interest", value=poi_text, inline=False)
            
            # Add resources if available
            if 'resources' in location and location['resources']:
                resource_text = ""
                for resource in location['resources'][:10]:  # Limit to 10
                    resource_text += f"• {resource['name']}\n"
                embed.add_field(name="Available Resources", value=resource_text, inline=False)
            
            # Add footer with map link
            map_url = f"{settings.WEBSITE_URL}/map?location={location['id']}"
            embed.set_footer(text=f"Use /resource to find specific gathering locations • Location ID: {location['id']}")
            
            # Create view with buttons
            view = discord.ui.View()
            
            # Add link to website map
            view.add_item(discord.ui.Button(label="View on Map", url=map_url))
            
            await interaction.followup.send(embed=embed, view=view)
            
        except Exception as e:
            logger.error(f"Error in location command: {e}")
            await interaction.followup.send("Sorry, I encountered an error retrieving location information.")
    
    async def resource_command(self, interaction: discord.Interaction, name: str):
        """Show where to find a specific resource."""
        if not await self._check_cooldown(interaction, "resource", 3):
            return
            
        await interaction.response.defer(thinking=True)
        
        try:
            # Get resource details
            resource = await item_service.get_resource(name)
            if not resource:
                await interaction.followup.send("Resource not found. Please try a different search term.")
                return
            
            # Get gathering locations for this resource
            locations = await location_service.get_resource_locations(resource['id'])
            
            # Create embed for resource
            embed = discord.Embed(
                title=f"{resource['name']} Gathering Guide",
                description=resource.get('description', 'No description available.'),
                color=discord.Color.green()
            )
            
            # Add image if available
            if 'image_url' in resource and resource['image_url']:
                embed.set_thumbnail(url=resource['image_url'])
            
            # Add basic info
            embed.add_field(name="Type", value=resource.get('type', 'Resource'), inline=True)
            embed.add_field(name="Gathering Skill", value=resource.get('gathering_skill', 'Unknown'), inline=True)
            
            # Add locations
            if locations:
                location_text = ""
                for location in locations[:8]:  # Limit to avoid too long embed
                    drop_rate = location.get('drop_rate', 0) * 100
                    location_text += f"• **{location['name']}**: {drop_rate:.1f}% drop rate\n"
                embed.add_field(name="Best Gathering Locations", value=location_text, inline=False)
            else:
                embed.add_field(name="Gathering Locations", value="No specific gathering locations found.", inline=False)
            
            # Add uses in crafting if available
            if 'used_in_recipes' in resource and resource['used_in_recipes']:
                recipe_text = ""
                for recipe in resource['used_in_recipes'][:5]:  # Limit to 5
                    recipe_text += f"• {recipe['name']}\n"
                embed.add_field(name="Used in Crafting", value=recipe_text, inline=False)
            
            # Add tips for gathering
            if 'gathering_tips' in resource and resource['gathering_tips']:
                embed.add_field(name="Gathering Tips", value=resource['gathering_tips'], inline=False)
            
            # Add footer
            embed.set_footer(text=f"Resource ID: {resource['id']} • Use /recipe to see crafting details")
            
            # Create view with buttons
            view = discord.ui.View()
            
            # Add link to website map
            map_url = f"{settings.WEBSITE_URL}/map?resource={resource['id']}"
            view.add_item(discord.ui.Button(label="View on Resource Map", url=map_url))
            
            await interaction.followup.send(embed=embed, view=view)
            
        except Exception as e:
            logger.error(f"Error in resource command: {e}")
            await interaction.followup.send("Sorry, I encountered an error retrieving resource information.")
    
    async def recipe_command(self, interaction: discord.Interaction, name: str):
        """Look up crafting recipe details."""
        if not await self._check_cooldown(interaction, "recipe", 3):
            return
            
        await interaction.response.defer(thinking=True)
        
        try:
            # Get recipe details
            recipe = await item_service.get_recipe(name)
            if not recipe:
                await interaction.followup.send("Recipe not found. Please try a different search term.")
                return
            
            # Create embed for recipe
            embed = discord.Embed(
                title=f"Recipe: {recipe['name']}",
                description=recipe.get('description', 'No description available.'),
                color=discord.Color.gold()
            )
            
            # Add image of the result item if available
            if 'result_item' in recipe and recipe['result_item'] and 'image_url' in recipe['result_item']:
                embed.set_thumbnail(url=recipe['result_item']['image_url'])
            
            # Add basic info
            embed.add_field(name="Crafting Skill", value=recipe.get('crafting_skill', 'Unknown'), inline=True)
            embed.add_field(name="Skill Level Required", value=str(recipe.get('skill_level', 'N/A')), inline=True)
            embed.add_field(name="Crafting Station", value=recipe.get('crafting_station', 'Any'), inline=True)
            
            # Add ingredients
            if 'ingredients' in recipe and recipe['ingredients']:
                ingredients_text = ""
                for ingredient in recipe['ingredients']:
                    ingredients_text += f"• **{ingredient['name']}**: {ingredient['amount']} {ingredient.get('quality', '')}\n"
                embed.add_field(name="Ingredients", value=ingredients_text, inline=False)
            
            # Add result details
            if 'result_item' in recipe and recipe['result_item']:
                result = recipe['result_item']
                result_text = f"**Amount**: {recipe.get('result_amount', 1)}\n"
                
                if 'rarity' in result:
                    result_text += f"**Rarity**: {result['rarity'].capitalize()}\n"
                    
                if 'stats' in result and result['stats']:
                    result_text += "**Stats**:\n"
                    for stat_name, value in result['stats'].items():
                        formatted_name = stat_name.replace('_', ' ').title()
                        result_text += f"- {formatted_name}: +{value}\n"
                
                embed.add_field(name="Result", value=result_text, inline=False)
            
            # Add recipe source
            if 'source' in recipe:
                embed.add_field(name="Recipe Source", value=recipe['source'], inline=False)
            
            # Add footer
            embed.set_footer(text=f"Recipe ID: {recipe['id']} • Use /item to view the result item details")
            
            # Create view with buttons
            view = discord.ui.View()
            
            # Add link to website crafting calculator
            crafting_url = f"{settings.WEBSITE_URL}/crafting/calculator?recipe={recipe['id']}"
            view.add_item(discord.ui.Button(label="Open in Crafting Calculator", url=crafting_url))
            
            # If result item exists, add button to view it
            if 'result_item' in recipe and recipe['result_item'] and 'id' in recipe['result_item']:
                item_button = discord.ui.Button(
                    label="View Result Item", 
                    custom_id=f"item:{recipe['result_item']['id']}"
                )
                item_button.callback = lambda i: self.item_command(i, recipe['result_item']['id'])
                view.add_item(item_button)
            
            await interaction.followup.send(embed=embed, view=view)
            
        except Exception as e:
            logger.error(f"Error in recipe command: {e}")
            await interaction.followup.send("Sorry, I encountered an error retrieving recipe information.")
    
    async def reset_command(self, interaction: discord.Interaction):
        """Reset chat history for a user."""
        user_id = str(interaction.user.id)
        if user_id in self.chat_sessions:
            self.chat_sessions[user_id] = []
            
        embed = discord.Embed(
            title="Chat History Reset",
            description="Your chat history has been reset. We're starting with a clean slate!",
            color=discord.Color.green()
        )
        
        await interaction.response.send_message(embed=embed, ephemeral=True)
    
    async def help_command(self, interaction: discord.Interaction):
        """Show help information about the bot."""
        embed = discord.Embed(
            title="MyAshes.ai Discord Bot - Help",
            description="I'm your Ashes of Creation assistant! Here's how you can interact with me:",
            color=discord.Color.blue()
        )
        
        # General commands
        embed.add_field(
            name="🔍 General Commands",
            value=(
                "• `/ask [question]` - Ask me anything about Ashes of Creation\n"
                "• `/help` - Show this help message\n"
                "• `/reset` - Reset your chat history with me"
            ),
            inline=False
        )
        
        # Game data commands
        embed.add_field(
            name="🎮 Game Data Commands",
            value=(
                "• `/item [name]` - Get detailed information about an item\n"
                "• `/build [query]` - Search for character builds\n"
                "• `/location [name]` - Get information about a location\n"
                "• `/resource [name]` - Find where to gather resources\n"
                "• `/recipe [name]` - Look up crafting recipes\n"
                "• `/server [name]` - Set your preferred server for contextual queries"
            ),
            inline=False
        )
        
        # Usage tips
        embed.add_field(
            name="💡 Tips",
            value=(
                "• Use autocomplete for accurate results\n"
                "• I maintain conversation context in `/ask` commands\n"
                "• For the best experience, be specific in your queries\n"
                "• Use `/server` to get server-specific information when relevant"
            ),
            inline=False
        )
        
        # Links
        embed.add_field(
            name="🔗 Useful Links",
            value=(
                f"• [MyAshes.ai Website]({settings.WEBSITE_URL})\n"
                f"• [Submit Feedback](https://forms.gle/ashesFeedbackForm)"
            ),
            inline=False
        )
        
        embed.set_footer(text="Data is updated regularly from official sources and community contributions.")
        
        # Add thumbnail
        embed.set_thumbnail(url=settings.BOT_LOGO_URL)
        
        await interaction.response.send_message(embed=embed, ephemeral=True)
    
    #==========================
    # Message processing
    #==========================
    
    async def on_message(self, message: discord.Message):
        """Handle direct messages to the bot."""
        # Ignore messages from the bot itself
        if message.author == self.user:
            return
            
        # Process direct messages
        if isinstance(message.channel, discord.DMChannel):
            # Check for command prefix
            if message.content.startswith('/'):
                # Let the command system handle it
                await self.process_commands(message)
                return
                
            # Regular message, treat as a question
            async with message.channel.typing():
                # Get or create chat session for this user
                user_id = str(message.author.id)
                if user_id not in self.chat_sessions:
                    self.chat_sessions[user_id] = []
                    
                # Add user message to chat history
                self.chat_sessions[user_id].append({
                    "role": "user",
                    "content": message.content
                })
                
                try:
                    # Get server context if any
                    server_context = await self.get_user_server(user_id)
                    
                    # Get response from AI
                    response_text, context_docs = await llm_service.get_chat_completion(
                        messages=self.chat_sessions[user_id],
                        query=message.content,
                        server=server_context
                    )
                    
                    # Add assistant response to chat history
                    self.chat_sessions[user_id].append({
                        "role": "assistant",
                        "content": response_text
                    })
                    
                    # Truncate history if it gets too long (keep most recent 20 messages)
                    if len(self.chat_sessions[user_id]) > 20:
                        self.chat_sessions[user_id] = self.chat_sessions[user_id][-20:]
                    
                    # Format and send response
                    await self.send_formatted_dm_response(message, response_text, context_docs)
                    
                except Exception as e:
                    logger.error(f"Error processing direct message: {e}")
                    await message.channel.send("Sorry, I encountered an error processing your message. Please try again.")
        
        # Process commands in the usual way
        await self.process_commands(message)
    
    async def on_interaction(self, interaction: discord.Interaction):
        """Handle button interactions."""
        if interaction.type == discord.InteractionType.component:
            # Handle pagination
            if interaction.data.get('custom_id', '').startswith('pagination:'):
                await self._handle_pagination(interaction)
            # Other custom buttons
            elif interaction.data.get('custom_id', '').startswith('similar:'):
                item_id = interaction.data.get('custom_id').split(':')[1]
                await self._handle_similar_items(interaction, item_id)
            elif interaction.data.get('custom_id', '').startswith('item:'):
                item_id = interaction.data.get('custom_id').split(':')[1]
                await interaction.response.defer(thinking=True)
                await self.item_command(interaction, item_id)
            # Pass to discord.py's handler
            else:
                await self._interaction_handler(interaction)
        else:
            # Pass to discord.py's handler
            await self._interaction_handler(interaction)
    
    #==========================
    # Helper methods
    #==========================
    
    async def get_user_server(self, user_id: str) -> Optional[str]:
        """Get the server context for a user."""
        try:
            from services.cache_service import get_cache
            cache = await get_cache()
            redis_key = f"discord:server:{user_id}"
            server_id = await cache.get(redis_key)
            
            if server_id:
                server = await server_service.get_server(server_id)
                return server['name'] if server else None
                
            return None
        except Exception as e:
            logger.error(f"Error getting user server context: {e}")
            return None
    
    async def send_formatted_response(self, interaction: discord.Interaction, question: str, text: str, context_docs: List[Dict[str, Any]]):
        """Format and send an AI response with proper formatting and context."""
        # Check if we can create an embed response
        if self._should_use_embed_for_response(text):
            # Create a nicer formatted embed
            embed = discord.Embed(
                title=self._generate_response_title(question),
                description=text[:4096],  # Discord embed description limit
                color=discord.Color.blue()
            )
            
            embed.set_author(
                name=f"Response to {interaction.user.display_name}",
                icon_url=interaction.user.display_avatar.url
            )
            
            # Add source information if available
            if context_docs:
                sources_text = ""
                for i, doc in enumerate(context_docs[:3], 1):
                    source_name = doc.get('source', '').split('/')[-1] or doc.get('source', 'Unknown')
                    doc_type = doc.get('type', 'Unknown')
                    server = doc.get('server', '')
                    server_text = f" | Server: {server}" if server else ""
                    
                    sources_text += f"{i}. **{source_name}** ({doc_type}{server_text})\n"
                
                if sources_text:
                    embed.add_field(name="Sources", value=sources_text, inline=False)
            
            embed.set_footer(text="Powered by MyAshes.ai • Data updated regularly")
            
            # If the text was too long for the description, send additional chunks
            if len(text) > 4096:
                await interaction.followup.send(embed=embed)
                
                # Send the rest in regular messages with proper chunking
                chunks = self._chunk_text(text[4096:])
                for chunk in chunks:
                    await interaction.followup.send(chunk)
            else:
                await interaction.followup.send(embed=embed)
        else:
            # Regular text response
            chunks = self._chunk_text(text)
            
            # Send first chunk as the main response
            await interaction.followup.send(chunks[0])
            
            # Send additional chunks as separate messages
            for chunk in chunks[1:]:
                await interaction.followup.send(chunk)
            
            # Add source information if available
            if context_docs:
                embed = discord.Embed(
                    title="Information Sources",
                    description="The response was based on these sources:",
                    color=discord.Color.blue()
                )
                
                # Add top 3 sources to the embed
                for i, doc in enumerate(context_docs[:3], 1):
                    source_name = doc.get('source', '').split('/')[-1] or doc.get('source', 'Unknown')
                    doc_type = doc.get('type', 'Unknown')
                    server = doc.get('server', '')
                    server_text = f" | Server: {server}" if server else ""
                    
                    embed.add_field(
                        name=f"Source {i}: {source_name}",
                        value=f"Type: {doc_type}{server_text}",
                        inline=False
                    )
                    
                await interaction.followup.send(embed=embed)
    
    async def send_formatted_dm_response(self, message: discord.Message, text: str, context_docs: List[Dict[str, Any]]):
        """Format and send an AI response in DMs."""
        # For DMs, we'll keep it simpler with just text chunking
        chunks = self._chunk_text(text)
        
        # Send all chunks
        for chunk in chunks:
            await message.channel.send(chunk)
        
        # Add source information if available
        if context_docs:
            embed = discord.Embed(
                title="Information Sources",
                description="The response was based on these sources:",
                color=discord.Color.blue()
            )
            
            # Add top 3 sources to the embed
            for i, doc in enumerate(context_docs[:3], 1):
                source_name = doc.get('source', '').split('/')[-1] or doc.get('source', 'Unknown')
                doc_type = doc.get('type', 'Unknown')
                server = doc.get('server', '')
                server_text = f" | Server: {server}" if server else ""
                
                embed.add_field(
                    name=f"Source {i}: {source_name}",
                    value=f"Type: {doc_type}{server_text}",
                    inline=False
                )
                
            await message.channel.send(embed=embed)
    
    def _chunk_text(self, text: str, limit: int = 1900) -> List[str]:
        """Split text into chunks of maximum size with smart boundaries."""
        if len(text) <= limit:
            return [text]
            
        chunks = []
        current_chunk = ""
        
        # Try to split on paragraph breaks first
        paragraphs = text.split('\n\n')
        
        for paragraph in paragraphs:
            # If this paragraph would put us over the limit
            if len(current_chunk) + len(paragraph) + 2 > limit:
                # If the current chunk has content, add it to chunks
                if current_chunk:
                    chunks.append(current_chunk)
                    current_chunk = ""
                
                # If the paragraph itself is too long, split it further
                if len(paragraph) > limit:
                    # Split by sentences
                    sentences = paragraph.replace('. ', '.|').replace('! ', '!|').replace('? ', '?|').split('|')
                    
                    for sentence in sentences:
                        if len(current_chunk) + len(sentence) + 1 > limit:
                            if current_chunk:
                                chunks.append(current_chunk)
                                current_chunk = ""
                            
                            # If the sentence is still too long, just split by characters
                            if len(sentence) > limit:
                                sentence_chunks = [sentence[i:i+limit] for i in range(0, len(sentence), limit)]
                                chunks.extend(sentence_chunks[:-1])
                                current_chunk = sentence_chunks[-1]
                            else:
                                current_chunk = sentence
                        else:
                            if current_chunk:
                                current_chunk += " " + sentence
                            else:
                                current_chunk = sentence
                else:
                    current_chunk = paragraph
            else:
                if current_chunk:
                    current_chunk += "\n\n" + paragraph
                else:
                    current_chunk = paragraph
        
        # Don't forget the last chunk
        if current_chunk:
            chunks.append(current_chunk)
            
        return chunks
    
    def _should_use_embed_for_response(self, text: str) -> bool:
        """Determine if the response should use an embed based on content."""
        # Check for code blocks which might break in embeds
        code_blocks = re.findall(r'```(?:\w+)?\n[\s\S]+?\n```', text)
        if code_blocks and len(''.join(code_blocks)) > 1000:
            return False
        
        # If too many lines, don't use embed
        if text.count('\n') > 50:
            return False
            
        # If very long text, don't use embed (most will be outside anyway)
        if len(text) > 8000:
            return False
            
        return True
    
    def _generate_response_title(self, question: str) -> str:
        """Generate a title for the response based on the question."""
        # Clean up the question
        clean_question = re.sub(r'[^\w\s\?\!]', '', question).strip()
        
        # Truncate if too long
        if len(clean_question) > 80:
            clean_question = clean_question[:77] + "..."
            
        return clean_question
    
    def _get_rarity_color(self, rarity: str) -> discord.Color:
        """Get color based on item rarity."""
        rarity = rarity.lower()
        if rarity == "common":
            return discord.Color.light_gray()
        elif rarity == "uncommon":
            return discord.Color.green()
        elif rarity == "rare":
            return discord.Color.blue()
        elif rarity == "epic":
            return discord.Color.purple()
        elif rarity == "legendary":
            return discord.Color.gold()
        elif rarity == "artifact":
            return discord.Color.red()
        else:
            return discord.Color.default()
    
    #==========================
    # Pagination helpers
    #==========================
    
    def _create_pagination_view(self, items: List[Any], embed_creator_func: Any) -> discord.ui.View:
        """Create a pagination view for navigating through multiple items."""
        view = discord.ui.View(timeout=300)  # 5 minute timeout
        
        # Previous button
        prev_button = discord.ui.Button(
            label="◀ Previous",
            custom_id=f"pagination:prev",
            style=discord.ButtonStyle.secondary,
            disabled=True  # Disabled for first page
        )
        
        # Next button
        next_button = discord.ui.Button(
            label="Next ▶",
            custom_id=f"pagination:next",
            style=discord.ButtonStyle.primary,
            disabled=len(items) <= 1  # Disabled if only one item
        )
        
        # Add buttons to view
        view.add_item(prev_button)
        view.add_item(next_button)
        
        # Generate a unique ID for this pagination
        pagination_id = str(uuid.uuid4())
        
        # Store pagination state
        self.paginations[pagination_id] = {
            "items": items,
            "current_index": 0,
            "embed_creator": embed_creator_func,
            "timestamp": datetime.now().timestamp()
        }
        
        # Store pagination ID in the custom IDs
        prev_button.custom_id = f"pagination:prev:{pagination_id}"
        next_button.custom_id = f"pagination:next:{pagination_id}"
        
        return view
    
    async def _handle_pagination(self, interaction: discord.Interaction):
        """Handle pagination button clicks."""
        custom_id = interaction.data.get('custom_id', '')
        parts = custom_id.split(':')
        
        if len(parts) < 3:
            await interaction.response.send_message("Invalid pagination ID", ephemeral=True)
            return
            
        action = parts[1]  # prev or next
        pagination_id = parts[2]
        
        # Get pagination state
        if pagination_id not in self.paginations:
            await interaction.response.send_message("This paginated view has expired. Please run the command again.", ephemeral=True)
            return
            
        pagination = self.paginations[pagination_id]
        current_index = pagination["current_index"]
        items = pagination["items"]
        embed_creator = pagination["embed_creator"]
        
        # Update index based on action
        if action == "prev" and current_index > 0:
            current_index -= 1
        elif action == "next" and current_index < len(items) - 1:
            current_index += 1
        
        # Update stored index
        pagination["current_index"] = current_index
        pagination["timestamp"] = datetime.now().timestamp()
        
        # Create new embed
        embed = await embed_creator(items[current_index], current_index + 1, len(items))
        
        # Create new view with updated button states
        view = discord.ui.View(timeout=300)
        
        prev_button = discord.ui.Button(
            label="◀ Previous",
            custom_id=f"pagination:prev:{pagination_id}",
            style=discord.ButtonStyle.secondary,
            disabled=current_index == 0
        )
        
        next_button = discord.ui.Button(
            label="Next ▶",
            custom_id=f"pagination:next:{pagination_id}",
            style=discord.ButtonStyle.primary,
            disabled=current_index == len(items) - 1
        )
        
        view.add_item(prev_button)
        view.add_item(next_button)
        
        # Update message
        await interaction.response.edit_message(embed=embed, view=view)
    
    async def _build_embed_creator(self, build: Dict[str, Any], index: int, total: int) -> discord.Embed:
        """Create an embed for a build."""
        embed = discord.Embed(
            title=build['name'],
            description=build.get('description', 'No description available.'),
            color=discord.Color.blue()
        )
        
        # Add build details
        embed.add_field(name="Creator", value=build.get('owner', 'Unknown'), inline=True)
        embed.add_field(name="Level", value=str(build.get('level', 'N/A')), inline=True)
        embed.add_field(name="Classes", value=f"{build['classes']['primary']['name']} / {build['classes']['secondary']['name']}", inline=True)
        
        # Add stats if available
        if 'stat_totals' in build:
            stats_text = ""
            for stat_name, value in build['stat_totals'].items():
                formatted_name = stat_name.replace('_', ' ').title()
                stats_text += f"**{formatted_name}:** {value}\n"
            embed.add_field(name="Stats", value=stats_text, inline=False)
        
        # Add key equipment if available
        if 'items' in build and build['items']:
            items_text = ""
            for item in build['items'][:5]:  # Show only key items
                rarity = item.get('rarity', 'common').capitalize()
                items_text += f"**{item['slot']}:** {item['name']} ({rarity})\n"
            embed.add_field(name="Key Equipment", value=items_text, inline=False)
        
        # Add tags if available
        if 'tags' in build and build['tags']:
            embed.add_field(name="Tags", value=", ".join(build['tags']), inline=False)
        
        # Add pagination indicator
        embed.set_footer(text=f"Build {index} of {total} • ID: {build['id']}")
        
        return embed
    
    #==========================
    # Interactive command helpers
    #==========================
    
    def _create_similar_items_callback(self, item: Dict[str, Any]):
        """Create a callback for the similar items button."""
        async def callback(interaction: discord.Interaction):
            await interaction.response.defer(thinking=True)
            
            try:
                similar_items = await item_service.get_similar_items(item['id'], limit=5)
                
                if not similar_items:
                    await interaction.followup.send("No similar items found.", ephemeral=True)
                    return
                
                # Create embed for similar items
                embed = discord.Embed(
                    title=f"Items Similar to {item['name']}",
                    description="Here are some similar items you might be interested in:",
                    color=discord.Color.blue()
                )
                
                for similar in similar_items:
                    # Format item details
                    details = f"**Type:** {similar.get('type', 'Unknown')}\n"
                    details += f"**Rarity:** {similar.get('rarity', 'Common').capitalize()}\n"
                    details += f"**Level:** {similar.get('level', 'N/A')}\n"
                    
                    # Add key stats if available
                    if 'stats' in similar and similar['stats']:
                        stats = list(similar['stats'].items())[:3]  # Show top 3 stats
                        stat_text = ""
                        for stat_name, value in stats:
                            formatted_name = stat_name.replace('_', ' ').title()
                            stat_text += f"{formatted_name}: +{value}, "
                        details += f"**Stats:** {stat_text.rstrip(', ')}"
                    
                    embed.add_field(
                        name=similar['name'],
                        value=details,
                        inline=False
                    )
                
                # Create view with item buttons
                view = discord.ui.View()
                
                for similar in similar_items:
                    button = discord.ui.Button(
                        label=f"View {similar['name']}",
                        custom_id=f"item:{similar['id']}"
                    )
                    button.callback = lambda i, id=similar['id']: self.item_command(i, id)
                    view.add_item(button)
                
                await interaction.followup.send(embed=embed, view=view)
                
            except Exception as e:
                logger.error(f"Error showing similar items: {e}")
                await interaction.followup.send("Sorry, I encountered an error retrieving similar items.", ephemeral=True)
        
        return callback
    
    async def _handle_similar_items(self, interaction: discord.Interaction, item_id: str):
        """Handle similar items button click."""
        await interaction.response.defer(thinking=True)
        
        try:
            item = await item_service.get_item(item_id)
            similar_callback = self._create_similar_items_callback(item)
            await similar_callback(interaction)
        except Exception as e:
            logger.error(f"Error handling similar items: {e}")
            await interaction.followup.send("Sorry, I encountered an error retrieving similar items.", ephemeral=True)
    
    async def _check_cooldown(self, interaction: discord.Interaction, command: str, cooldown_seconds: int) -> bool:
        """Check if a command is on cooldown for a user."""
        user_id = str(interaction.user.id)
        
        # Initialize user cooldowns if not exist
        if user_id not in self.cooldowns:
            self.cooldowns[user_id] = {}
        
        current_time = datetime.now().timestamp()
        
        # Check if command is on cooldown
        if command in self.cooldowns[user_id]:
            time_diff = current_time - self.cooldowns[user_id][command]
            if time_diff < cooldown_seconds:
                # Command is on cooldown
                remaining = int(cooldown_seconds - time_diff)
                await interaction.response.send_message(
                    f"Please wait {remaining} second(s) before using this command again.",
                    ephemeral=True
                )
                return False
        
        # Set cooldown
        self.cooldowns[user_id][command] = current_time
        return True

async def start_discord_bot():
    """Start the Discord bot."""
    if not settings.DISCORD_BOT_TOKEN:
        logger.warning("DISCORD_BOT_TOKEN not set. Discord bot will not start.")
        return
    
    bot = AshesAssistantBot()
    
    try:
        await bot.start(settings.DISCORD_BOT_TOKEN)
    except Exception as e:
        logger.error(f"Error starting Discord bot: {e}")
    finally:
        if not bot.is_closed():
            await bot.close()
            
if __name__ == "__main__":
    asyncio.run(start_discord_bot())
