import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building,
  IndianRupee,
  Calendar,
  Edit2,
  Save,
  X,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  occupation: string;
  company: string;
  monthly_income: string;
  bio: string;
}

const emptyProfile: UserProfile = {
  name: "",
  email: "",
  phone: "",
  date_of_birth: "",
  gender: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  occupation: "",
  company: "",
  monthly_income: "",
  bio: "",
};

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(emptyProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error);
        return;
      }

      if (data) {
        const profileData: UserProfile = {
          name: data.name || "",
          email: data.email || user?.email || "",
          phone: data.phone || "",
          date_of_birth: data.date_of_birth || "",
          gender: data.gender || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          pincode: data.pincode || "",
          occupation: data.occupation || "",
          company: data.company || "",
          monthly_income: data.monthly_income?.toString() || "",
          bio: data.bio || "",
        };
        setProfile(profileData);
        setEditedProfile(profileData);
      } else {
        const defaultProfile = { ...emptyProfile, email: user?.email || "" };
        setProfile(defaultProfile);
        setEditedProfile(defaultProfile);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: editedProfile.name,
          email: editedProfile.email,
          phone: editedProfile.phone,
          date_of_birth: editedProfile.date_of_birth || null,
          gender: editedProfile.gender,
          address: editedProfile.address,
          city: editedProfile.city,
          state: editedProfile.state,
          pincode: editedProfile.pincode,
          occupation: editedProfile.occupation,
          company: editedProfile.company,
          monthly_income: editedProfile.monthly_income ? parseFloat(editedProfile.monthly_income) : null,
          bio: editedProfile.bio,
          profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user?.id);

      if (error) throw error;

      setProfile(editedProfile);
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }));
  };

  const renderField = (
    Icon: React.ElementType,
    label: string,
    value: string,
    field: keyof UserProfile,
    type = "text"
  ) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </label>
      {isEditing ? (
        <Input
          type={type}
          value={editedProfile[field]}
          onChange={(e) => handleInputChange(field, e.target.value)}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      ) : (
        <p className="text-foreground font-medium">
          {value || <span className="text-muted-foreground italic">Not set</span>}
        </p>
      )}
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Profile</h1>
            <p className="text-muted-foreground mt-1">
              Manage your personal information
            </p>
          </div>
          {isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} className="gap-2" disabled={saving}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button variant="gold" onClick={handleSave} className="gap-2" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
              <Edit2 className="h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gold-gradient flex items-center justify-center text-3xl font-bold text-primary-foreground">
                {profile.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div>
                <CardTitle className="text-2xl">{profile.name || "Complete Your Profile"}</CardTitle>
                <p className="text-muted-foreground">{profile.email}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b border-border/50 pb-2">
                  Personal Information
                </h3>
                {renderField(User, "Full Name", profile.name, "name")}
                {renderField(Mail, "Email", profile.email, "email", "email")}
                {renderField(Phone, "Phone", profile.phone, "phone", "tel")}
                {renderField(
                  Calendar,
                  "Date of Birth",
                  profile.date_of_birth
                    ? new Date(profile.date_of_birth).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "",
                  "date_of_birth",
                  "date"
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Gender
                  </label>
                  {isEditing ? (
                    <select
                      className="w-full h-11 rounded-lg border border-border/50 bg-card/50 px-4 py-2 text-base"
                      value={editedProfile.gender}
                      onChange={(e) => handleInputChange("gender", e.target.value)}
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <p className="text-foreground font-medium">
                      {profile.gender || <span className="text-muted-foreground italic">Not set</span>}
                    </p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b border-border/50 pb-2">
                  Address
                </h3>
                {renderField(MapPin, "Street Address", profile.address, "address")}
                {renderField(Building, "City", profile.city, "city")}
                {renderField(MapPin, "State", profile.state, "state")}
                {renderField(MapPin, "Pincode", profile.pincode, "pincode")}
              </div>

              {/* Professional */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b border-border/50 pb-2">
                  Professional Details
                </h3>
                {renderField(Briefcase, "Occupation", profile.occupation, "occupation")}
                {renderField(Building, "Company", profile.company, "company")}
                {renderField(
                  IndianRupee,
                  "Monthly Income",
                  profile.monthly_income ? `₹${parseInt(profile.monthly_income).toLocaleString()}` : "",
                  "monthly_income",
                  "number"
                )}
              </div>

              {/* Bio */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b border-border/50 pb-2">
                  About
                </h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Bio</label>
                  {isEditing ? (
                    <textarea
                      className="w-full h-32 rounded-lg border border-border/50 bg-card/50 px-4 py-2 text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                      value={editedProfile.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p className="text-foreground">
                      {profile.bio || <span className="text-muted-foreground italic">Not set</span>}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
