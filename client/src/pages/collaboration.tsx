import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

// Mock data for collaborators - in production this would come from the backend
const mockCollaborators = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "Sci-Fi Editor",
    specialty: "Science Fiction",
    experience: "8 years",
    rating: 4.9,
    match: 95,
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b588?ixlib=rb-4.0.3&w=150&h=150&fit=crop&crop=face",
    skills: ["Line Editing", "Developmental Editing", "Genre Expertise"],
    rate: "$0.015/word",
    availability: "Available",
    bio: "Award-winning editor specializing in hard science fiction with a background in astrophysics."
  },
  {
    id: 2,
    name: "Mike Rodriguez",
    role: "Co-writer",
    specialty: "Thriller/Mystery",
    experience: "12 years",
    rating: 4.8,
    match: 88,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&w=150&h=150&fit=crop&crop=face",
    skills: ["Plot Development", "Character Creation", "Dialogue"],
    rate: "30% royalty split",
    availability: "Available",
    bio: "Bestselling thriller author with 15 published novels. Expert in fast-paced narratives."
  },
  {
    id: 3,
    name: "Emma Thompson",
    role: "Beta Reader",
    specialty: "Romance/Fantasy",
    experience: "5 years",
    rating: 4.7,
    match: 92,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&w=150&h=150&fit=crop&crop=face",
    skills: ["Reader Perspective", "Pacing Analysis", "Character Development"],
    rate: "$0.005/word",
    availability: "Busy until March",
    bio: "Voracious reader with expertise in romance tropes and fantasy world-building."
  },
  {
    id: 4,
    name: "David Park",
    role: "Developmental Editor",
    specialty: "Non-Fiction",
    experience: "10 years",
    rating: 4.9,
    match: 85,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=150&h=150&fit=crop&crop=face",
    skills: ["Structure", "Research Verification", "Academic Writing"],
    rate: "$0.02/word",
    availability: "Available",
    bio: "Former university professor with expertise in technical and academic writing."
  }
];

const collaborationTypes = [
  { value: "editor", label: "Professional Editor", icon: "fas fa-edit" },
  { value: "co-writer", label: "Co-writer", icon: "fas fa-users" },
  { value: "beta-reader", label: "Beta Reader", icon: "fas fa-glasses" },
  { value: "consultant", label: "Subject Matter Expert", icon: "fas fa-brain" },
  { value: "translator", label: "Translator", icon: "fas fa-language" },
];

const genres = [
  "Science Fiction", "Fantasy", "Romance", "Mystery", "Thriller", 
  "Horror", "Self-Help", "Technology", "Biography", "History", "Other"
];

export default function Collaboration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedCollaborator, setSelectedCollaborator] = useState<any>(null);
  const [inviteMessage, setInviteMessage] = useState("");

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: () => api.getProjects(),
  });

  const { data: userCollaborations } = useQuery({
    queryKey: ["/api/user/collaborations"],
    queryFn: () => api.getUserCollaborations ? api.getUserCollaborations() : [],
  });

  // Filter collaborators based on search criteria
  const filteredCollaborators = mockCollaborators.filter(collaborator => {
    const matchesSearch = searchTerm === "" || 
      collaborator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collaborator.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collaborator.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesGenre = selectedGenre === "all" || 
      collaborator.specialty.toLowerCase().includes(selectedGenre.toLowerCase());
    
    const matchesRole = selectedRole === "all" || 
      collaborator.role.toLowerCase().includes(selectedRole.toLowerCase());
    
    return matchesSearch && matchesGenre && matchesRole;
  });

  const handleSendInvite = (collaborator: any) => {
    // In production, this would call the API to send an invitation
    toast({
      title: "Invitation Sent",
      description: `Collaboration invitation sent to ${collaborator.name}`,
    });
    setSelectedCollaborator(null);
    setInviteMessage("");
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "busy":
      case "busy until march":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getMatchColor = (match: number) => {
    if (match >= 90) return "text-green-600";
    if (match >= 80) return "text-blue-600";
    if (match >= 70) return "text-yellow-600";
    return "text-gray-600";
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header 
          title="Collaboration Hub"
          subtitle="Connect with editors, co-writers, and beta readers"
          actions={
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <i className="fas fa-plus mr-2"></i>Post Project
            </Button>
          }
        />

        <div className="p-6 space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-search text-blue-600 mr-2"></i>
                Find Collaborators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Name, skills, specialty..."
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All roles</SelectItem>
                      {collaborationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.label}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="genre">Genre</Label>
                  <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                    <SelectTrigger>
                      <SelectValue placeholder="All genres" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All genres</SelectItem>
                      {genres.map((genre) => (
                        <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedGenre("");
                      setSelectedRole("");
                    }}
                  >
                    <i className="fas fa-refresh mr-2"></i>
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="discover" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="discover">Discover Collaborators</TabsTrigger>
              <TabsTrigger value="active">Active Collaborations</TabsTrigger>
              <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            </TabsList>

            <TabsContent value="discover" className="space-y-6">
              {/* Collaborators Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredCollaborators.map((collaborator) => (
                  <Card key={collaborator.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <img
                          src={collaborator.avatar}
                          alt={collaborator.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold">{collaborator.name}</h3>
                            <div className="flex items-center space-x-2">
                              <span className={`text-2xl font-bold ${getMatchColor(collaborator.match)}`}>
                                {collaborator.match}%
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">match</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 mb-3">
                            <Badge variant="outline">{collaborator.role}</Badge>
                            <Badge className={getStatusColor(collaborator.availability)}>
                              {collaborator.availability}
                            </Badge>
                            <div className="flex items-center text-sm text-yellow-600">
                              <i className="fas fa-star mr-1"></i>
                              {collaborator.rating}
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {collaborator.bio}
                          </p>

                          <div className="flex flex-wrap gap-1 mb-3">
                            {collaborator.skills.map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-sm">
                              <div className="font-semibold text-green-600">{collaborator.rate}</div>
                              <div className="text-gray-500 dark:text-gray-400">{collaborator.experience} experience</div>
                            </div>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm"
                                  onClick={() => setSelectedCollaborator(collaborator)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  <i className="fas fa-handshake mr-2"></i>
                                  Collaborate
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Send Collaboration Invite</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="flex items-center space-x-3">
                                    <img
                                      src={collaborator.avatar}
                                      alt={collaborator.name}
                                      className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div>
                                      <div className="font-semibold">{collaborator.name}</div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">{collaborator.role}</div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <Label htmlFor="project">Select Project</Label>
                                    <Select>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Choose a project" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {projects?.map((project) => (
                                          <SelectItem key={project.id} value={project.id.toString()}>
                                            {project.title}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <Label htmlFor="message">Personal Message</Label>
                                    <Textarea
                                      id="message"
                                      value={inviteMessage}
                                      onChange={(e) => setInviteMessage(e.target.value)}
                                      placeholder="Introduce yourself and your project..."
                                      className="min-h-[100px]"
                                    />
                                  </div>

                                  <Button 
                                    onClick={() => handleSendInvite(collaborator)}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <i className="fas fa-paper-plane mr-2"></i>
                                    Send Invitation
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredCollaborators.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <i className="fas fa-search text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      No Collaborators Found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Try adjusting your search criteria or browse all available collaborators.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="fas fa-project-diagram text-green-600 mr-2"></i>
                    Active Collaborations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <i className="fas fa-users text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      No Active Collaborations
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      Start collaborating with editors, co-writers, and beta readers to bring your projects to life.
                    </p>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <i className="fas fa-search mr-2"></i>
                      Find Collaborators
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="opportunities" className="space-y-6">
              {/* Collaboration Opportunities */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <i className="fas fa-lightbulb text-amber-600 mr-2"></i>
                      AI Matching Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 rounded-lg border-l-4 border-green-500">
                        <h4 className="font-mono text-sm text-green-600 mb-2">🤝 COLLABORATION OPPORTUNITIES</h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-start space-x-3">
                            <img 
                              src={mockCollaborators[0].avatar} 
                              alt="Collaborator" 
                              className="w-8 h-8 rounded-full object-cover" 
                            />
                            <div>
                              <div className="font-semibold text-slate-700 dark:text-slate-200">{mockCollaborators[0].name}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">{mockCollaborators[0].role} • {mockCollaborators[0].match}% Match</div>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-3">
                            <img 
                              src={mockCollaborators[1].avatar} 
                              alt="Collaborator" 
                              className="w-8 h-8 rounded-full object-cover" 
                            />
                            <div>
                              <div className="font-semibold text-slate-700 dark:text-slate-200">{mockCollaborators[1].name}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">{mockCollaborators[1].role} • {mockCollaborators[1].match}% Style Match</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                          <i className="fas fa-handshake mr-2"></i>Start Collaborating
                        </Button>
                        <Button variant="outline" className="w-full">
                          <i className="fas fa-search mr-2"></i>Find Beta Readers
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <i className="fas fa-chart-network text-purple-600 mr-2"></i>
                      Collaboration Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Profile Views</span>
                        <span className="font-semibold">234 this month</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Collaboration Requests</span>
                        <span className="font-semibold">8 pending</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Match Score Average</span>
                        <span className="font-semibold text-green-600">87%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Projects Open to Collaboration</span>
                        <span className="font-semibold">{projects?.length || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tips for Better Collaboration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="fas fa-tips text-blue-600 mr-2"></i>
                    Collaboration Best Practices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3 text-green-700 dark:text-green-300">
                        💡 Finding the Right Collaborator
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li className="flex items-start">
                          <i className="fas fa-check text-green-500 mr-2 mt-0.5"></i>
                          Look for high match percentages (80%+)
                        </li>
                        <li className="flex items-start">
                          <i className="fas fa-check text-green-500 mr-2 mt-0.5"></i>
                          Review their portfolio and past work
                        </li>
                        <li className="flex items-start">
                          <i className="fas fa-check text-green-500 mr-2 mt-0.5"></i>
                          Check availability and response time
                        </li>
                        <li className="flex items-start">
                          <i className="fas fa-check text-green-500 mr-2 mt-0.5"></i>
                          Consider genre expertise and specialization
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3 text-blue-700 dark:text-blue-300">
                        🤝 Successful Collaboration Tips
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li className="flex items-start">
                          <i className="fas fa-check text-blue-500 mr-2 mt-0.5"></i>
                          Set clear expectations and deadlines
                        </li>
                        <li className="flex items-start">
                          <i className="fas fa-check text-blue-500 mr-2 mt-0.5"></i>
                          Communicate regularly and openly
                        </li>
                        <li className="flex items-start">
                          <i className="fas fa-check text-blue-500 mr-2 mt-0.5"></i>
                          Use version control and track changes
                        </li>
                        <li className="flex items-start">
                          <i className="fas fa-check text-blue-500 mr-2 mt-0.5"></i>
                          Provide constructive feedback
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
